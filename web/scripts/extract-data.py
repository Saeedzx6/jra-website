"""Extract JRA directory data from the nopCommerce xlsx exports into web/data/*.json.

Stdlib only (zipfile + xml.etree; no pandas). Run from anywhere:
    python web/scripts/extract-data.py

Derived from mockups/tools/extract.py, with three changes:

  1. Suppliers are EXTRACTED, not discarded. The mockup extractor treated the
     supplier trades as noise to filter out of the cuisine vocabulary
     (NOT_CUISINES). They are a co-equal directory in the WRD, so they now get
     their own collection keyed by trade.

  2. The whole directory is emitted, not a hand-picked twelve. The mockups
     needed photogenic hero cards; a real directory needs every member, so
     photography is a per-row property rather than an entry requirement.

  3. Output is JSON per collection rather than one JS global, so the Next app
     can import it as typed data.

Two traps inherited from the source exports, both still handled here:
  - Blank cells are omitted on export, so a row's values sit one or two columns
    left of their header. Fields are recovered by content shape, resolving each
    cell by its `r=` column reference rather than by position.
  - Picture1 is the venue LOGO, not a photograph. Picture2/3 are the real
    photography, hence logo = images[0], image = images[1].
"""

import json
import os
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT_DIR = os.path.abspath(os.path.join(HERE, "..", "data"))
IMG_BASE = "https://jra.jo/content/images/thumbs/"


# --------------------------------------------------------------------------
# xlsx reading
# --------------------------------------------------------------------------

def col_index(ref):
    """'AB12' -> 27 (0-based column)."""
    letters = re.match(r"[A-Z]+", ref).group(0)
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_sheet(path):
    """Yield rows as lists, resolving cells by their column ref so blanks don't shift."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
    sheet = sorted(n for n in z.namelist() if n.startswith("xl/worksheets/sheet"))[0]
    root = ET.fromstring(z.read(sheet))
    for row in root.iter(NS + "row"):
        cells = {}
        width = 0
        for c in row:
            ref = c.get("r")
            i = col_index(ref) if ref else len(cells)
            t = c.get("t")
            if t == "inlineStr":
                txt = "".join(n.text or "" for n in c.iter(NS + "t"))
            else:
                v = c.find(NS + "v")
                txt = v.text if v is not None else ""
                if t == "s" and txt:
                    txt = shared[int(txt)]
            cells[i] = txt or ""
            width = max(width, i + 1)
        yield [cells.get(i, "") for i in range(width)]


# --------------------------------------------------------------------------
# cleaning
# --------------------------------------------------------------------------

def fix_mojibake(s):
    """The export lost the original encoding; U+FFFD is all that survived, so repair
    the handful of patterns it actually stands for and drop whatever is left."""
    if not s:
        return ""
    s = s.replace("��", "'").replace("�", "")
    return s


def strip_html(s):
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = (s.replace("&nbsp;", " ").replace("&amp;", "&")
          .replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"'))
    return re.sub(r"\s+", " ", fix_mojibake(s)).strip()


def split_list(s):
    return [p.strip() for p in (s or "").split(";") if p.strip()]


def image_url(path):
    if not path:
        return ""
    base = path.replace("/", "\\").split("\\")[-1].strip()
    return IMG_BASE + base if base else ""


def slugify(name):
    """URL-safe slug. Arabic names transliterate to nothing, so those fall back
    to a stable hash-free ascii form built from whatever latin survives."""
    s = unicodedata.normalize("NFKD", name)
    s = s.encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "entry"


def unique_slug(name, taken):
    base = slugify(name)
    slug, n = base, 2
    while slug in taken:
        slug = f"{base}-{n}"
        n += 1
    taken.add(slug)
    return slug


# --------------------------------------------------------------------------
# vocabularies
# --------------------------------------------------------------------------

CITIES = ["Amman", "Irbid", "Zarqa", "Aqaba", "Petra", "Dead Sea", "Jerash", "Madaba",
          "Salt", "Ajloun", "Karak", "Almafraq", "Azraq", "Fuhais", "Ramtha",
          "Wadi Rum", "Ma'an"]

def supplier_trades():
    """Names of every category descending from the top-level "Suppliers" node.

    categories.xlsx is a real tree (Id / Name / ParentCategoryId) holding three
    unrelated things: the two top-level directories, the supplier trade
    taxonomy, and a set of job-role categories belonging to the recruitment
    side (Executive Office, Porter, Financial Controller...). Walking down from
    "Suppliers" is what separates the trades from the job roles — an explicit
    hardcoded list drifts the moment the association adds a trade.
    """
    rows = list(read_sheet(os.path.join(SRC, "categories.xlsx")))
    header = rows[0]
    ix = {n: i for i, n in enumerate(header)}
    cid, cname, cparent = ix["Id"], ix["Name"], ix["ParentCategoryId"]

    nodes, children = {}, {}
    for r in rows[1:]:
        if len(r) <= max(cid, cname, cparent):
            continue
        node_id = (r[cid] or "").strip()
        name = fix_mojibake(r[cname]).strip()
        parent = (r[cparent] or "0").strip()
        if not node_id or not name:
            continue
        nodes[node_id] = name
        children.setdefault(parent, []).append(node_id)

    root = next((i for i, n in nodes.items() if n.lower() == "suppliers"), None)
    if root is None:
        return set()

    found, stack = set(), list(children.get(root, []))
    while stack:
        node_id = stack.pop()
        found.add(nodes[node_id].lower())
        stack.extend(children.get(node_id, []))
    return found

FEATURES = ["Accept Booking", "Outdoor dining", "Indoor dining", "Parking", "Delivery",
            "Good for groups", "Family place", "Kids friendly", "Casual dress",
            "Credit card accepted", "Reservations", "Shisha (Argeeleh)",
            "Serves alcohol", "Live music", "Soft music", "Catering",
            "Wheelchair accessible", "Breakfast", "Lunch", "Dinner"]

# Recognisable names with usable photography — promoted to the home page rail.
FEATURED = [
    "Reem Al Bawadi", "Fakhreldin", "Zaatar W Zeit", "Shams El Balad",
    "Romero Restaurant", "Peking", "Vintage Restaurant", "Abu Jbara",
    "Arabica Jordan", "Al Mankal", "Ararat Restaurant", "Fame Restaurant",
]


# Amman districts and landmarks. An address naming one of these is real
# evidence the venue is in Amman; "no match" is not.
AMMAN_DISTRICTS = [
    "abdoun", "abdali", "sweifieh", "swefieh", "shmeisani", "jabal amman",
    "dabouq", "khalda", "um uthaina", "umm uthaina", "deir ghbar", "tla al ali",
    "tlaa al ali", "wadi saqra", "rainbow street", "jabal al weibdeh",
    "weibdeh", "marj al hamam", "airport road", "mecca street", "makkah street",
    "gardens street", "wasfi al tal", "circle", "roundabout", "jubeiha",
    "sports city", "medina street", "zahran", "shmesani", "al bayader",
    "bayader", "naour", "mahis", "sahab", "muqabalain", "jabal hussein",
]


def city_of(addr):
    """Resolve a governorate from a free-text address.

    Returns "" when the address gives no evidence, rather than defaulting to
    Amman. The mockup extractor defaulted, which invented a governorate for
    42% of restaurants and 95% of suppliers — including 99 entries with no
    address at all, and rows whose "address" is something like "For Iraqi
    cuisine". That turned an empty field into a confident wrong answer, made
    the governorate filter mostly decorative, and inflated the "17 governorates
    covered" figure on the home page.
    """
    text = (addr or "").lower()
    if not text.strip():
        return ""
    for c in CITIES:
        if c.lower() in text:
            return c
    # Fall back to Amman only on a named Amman district, never on silence.
    for district in AMMAN_DISTRICTS:
        if district in text:
            return "Amman"
    return ""


# --------------------------------------------------------------------------
# parsing
# --------------------------------------------------------------------------

def looks_like_markup(cell):
    """FullDescription is raw HTML, and inline style attributes are full of
    semicolons ("color: #000000; text-align: start"). Those cells would otherwise
    be mistaken for semicolon-delimited tag lists, so they are rejected outright."""
    c = cell.lower()
    return "<" in c or ">" in c or "style=" in c or ":" in c


def parse_entries(vocab):
    """Parse every row into a neutral record. Restaurant/supplier is decided later.

    `vocab` is the authoritative Name column from manufacturers.xlsx. A single
    semicolon-cell is only accepted as the entry's cuisine/trade if it actually
    appears there — otherwise amenity values like "Casual Dress" leak into the
    cuisine vocabulary, which is how "Training" ended up listed as a cuisine.
    """
    rows = list(read_sheet(os.path.join(SRC, "resutaurants.xlsx")))
    header = rows[0]
    idx = {name: i for i, name in enumerate(header)}
    known = {str(v).lower() for v in vocab}
    out = []
    for r in rows[1:]:
        def get(key):
            i = idx.get(key)
            return r[i] if i is not None and i < len(r) else ""

        name = fix_mojibake(get("Name")).strip()
        if not name:
            continue

        joined = [c for c in r if c]
        pics = [p for p in (image_url(c) for c in joined if "\\thumbs\\" in c) if p]
        tag_cells = [c for c in joined
                     if ";" in c and "\\" not in c and not looks_like_markup(c)]

        trade, tags, category = "", [], ""
        for cell in tag_cells:
            parts = split_list(cell)
            if parts == ["Restaurants"] or parts == ["Suppliers"]:
                category = parts[0]
            elif len(parts) == 1 and not trade and parts[0].lower() in known:
                trade = parts[0]
            elif len(parts) > 1:
                tags = parts

        addr = fix_mojibake(get("ShortDescription") or "").replace("\n", " ")
        addr = re.sub(r"\s*\|\s*", ", ", addr)
        addr = re.sub(r"[-\s]+$", "", re.sub(r"\s+", " ", addr)).strip(" ,-")

        blurb = strip_html(get("FullDescription"))
        if blurb.lower().startswith("restaurant template"):
            blurb = ""

        out.append({
            "name": name,
            "address": addr,
            "trade": trade,
            "category": category or "Restaurants",
            "tags": tags,
            "blurb": blurb[:220],
            "images": pics[:3],
        })
    return out


def parse_column(filename, column="Name"):
    rows = list(read_sheet(os.path.join(SRC, filename)))
    header = rows[0]
    if column not in header:
        return [r[0] for r in rows[1:] if r and r[0]]
    i = header.index(column)
    seen, out = set(), []
    for r in rows[1:]:
        v = fix_mojibake(r[i]).strip() if i < len(r) else ""
        if v and v.lower() not in seen:
            seen.add(v.lower())
            out.append(v)
    return out


def is_supplier(e, trades):
    return e["category"] == "Suppliers" or e["trade"].lower() in trades


def shape(e, slugs):
    """Common shape for both collections. Photography is optional: a directory
    row degrades to a logo, and the UI falls back to a monogram if even that
    is missing."""
    imgs = e["images"]
    return {
        "slug": unique_slug(e["name"], slugs),
        "name": e["name"],
        "address": e["address"],
        "city": city_of(e["address"]),
        "tags": e["tags"][:6],
        "blurb": e["blurb"],
        "logo": imgs[0] if imgs else "",
        "image": imgs[1] if len(imgs) > 1 else "",
        "image2": imgs[2] if len(imgs) > 2 else "",
    }


def main():
    # Two separate vocabularies: manufacturers.xlsx holds cuisines only, the
    # supplier trades come from the "Suppliers" branch of the category tree.
    cuisine_vocab = parse_column("manufacturers.xlsx")
    trades_vocab = supplier_trades()
    entries = parse_entries(set(cuisine_vocab) | trades_vocab)

    restaurants, suppliers = [], []
    slugs = set()
    for e in entries:
        rec = shape(e, slugs)
        if is_supplier(e, trades_vocab):
            rec["trade"] = e["trade"] or "Others"
            suppliers.append(rec)
        else:
            rec["cuisine"] = e["trade"]
            restaurants.append(rec)

    # Home-page rail: the hand-picked names, then top up with any other
    # well-photographed venue, keeping cuisines varied.
    by_name = {r["name"].lower(): r for r in restaurants}
    featured, used = [], set()
    for want in FEATURED:
        r = by_name.get(want.lower())
        if r and r["image"]:
            featured.append(r["slug"])
            used.add(r["cuisine"])
    for r in restaurants:
        if len(featured) >= 12:
            break
        if r["image"] and r["slug"] not in featured and r["cuisine"] and r["cuisine"] not in used:
            featured.append(r["slug"])
            used.add(r["cuisine"])

    cuisines = sorted({r["cuisine"] for r in restaurants if r["cuisine"]})
    trades = sorted({s["trade"] for s in suppliers if s["trade"]})

    os.makedirs(OUT_DIR, exist_ok=True)

    def write(name, payload):
        path = os.path.join(OUT_DIR, name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
        return path

    write("restaurants.json", restaurants)
    write("suppliers.json", suppliers)
    write("vocab.json", {
        "cuisines": cuisines,
        "trades": trades,
        "cities": CITIES,
        "features": FEATURES,
        "featured": featured[:12],
        "totals": {
            "restaurants": len(restaurants),
            "suppliers": len(suppliers),
            "cuisines": len(cuisines),
            "trades": len(trades),
            "governorates": len(CITIES),
            "features": len(FEATURES),
        },
    })

    print(f"entries parsed   : {len(entries)}")
    print(f"restaurants      : {len(restaurants)}  (with photo: {sum(1 for r in restaurants if r['image'])})")
    print(f"suppliers        : {len(suppliers)}  (with photo: {sum(1 for s in suppliers if s['image'])})")
    print(f"cuisines         : {len(cuisines)}")
    print(f"trades           : {len(trades)} -> {trades}")
    print(f"featured on home : {len(featured[:12])}")
    print(f"-> {OUT_DIR}")


if __name__ == "__main__":
    main()
