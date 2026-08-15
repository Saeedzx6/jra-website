"""Extract JRA restaurant data from the nopCommerce xlsx exports into shared/data.js.

Stdlib only. Run from anywhere:  python mockups/tools/extract.py
"""
import html
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.abspath(os.path.join(HERE, "..", "shared", "data.js"))
IMG_BASE = "https://jra.jo/content/images/thumbs/"


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
                # some sheets embed strings inline instead of in sharedStrings
                txt = "".join(n.text or "" for n in c.iter(NS + "t"))
            else:
                v = c.find(NS + "v")
                txt = v.text if v is not None else ""
                if t == "s" and txt:
                    txt = shared[int(txt)]
            cells[i] = txt or ""
            width = max(width, i + 1)
        yield [cells.get(i, "") for i in range(width)]


def fix_mojibake(s):
    """The export lost the original encoding; U+FFFD is all that survived, so repair
    the handful of patterns it actually stands for and drop whatever is left."""
    if not s:
        return s
    for bad, good in (("caf�", "café"), ("Caf�", "Café"),
                      ("�s ", "'s "), ("�t ", "'t "),
                      ("�", " "), (" ", " "), (" ", " ")):
        s = s.replace(bad, good)
    return re.sub(r"\s+", " ", s)


def strip_html(s):
    s = re.sub(r"<br\s*/?>", " ", s or "", flags=re.I)
    s = re.sub(r"</p>", " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", fix_mojibake(s)).strip()


def split_list(s):
    return [p.strip() for p in (s or "").split(";") if p.strip()]


def image_url(path):
    if not path or "\\" not in path:
        return ""
    name = path.rsplit("\\", 1)[-1].strip()
    return IMG_BASE + name if name else ""


def parse_restaurants():
    rows = list(read_sheet(os.path.join(SRC, "resutaurants.xlsx")))
    header = rows[0]
    idx = {name: i for i, name in enumerate(header)}
    out = []
    for r in rows[1:]:
        def get(key):
            i = idx.get(key)
            return r[i] if i is not None and i < len(r) else ""

        name = fix_mojibake(get("Name")).strip()
        if not name:
            continue
        # Blank cells were dropped on export, so a row's values can sit one or two
        # columns to the left of the header. Recover the fields we care about by
        # matching on content shape rather than trusting the column position.
        joined = [c for c in r if c]
        pics = [image_url(c) for c in joined if "\\thumbs\\" in c]
        pics = [p for p in pics if p]
        tag_cells = [c for c in joined if ";" in c and "\\" not in c]
        cuisine, tags, category = "", [], ""
        for cell in tag_cells:
            parts = split_list(cell)
            if parts == ["Restaurants"] or parts == ["Suppliers"]:
                category = parts[0]
            elif len(parts) == 1 and not cuisine:
                cuisine = parts[0]
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
            "cuisine": cuisine,
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


CITIES = ["Amman", "Irbid", "Zarqa", "Aqaba", "Petra", "Dead Sea", "Jerash", "Madaba",
          "Salt", "Ajloun", "Karak", "Almafraq", "Azraq", "Fuhais", "Ramtha",
          "Wadi Rum", "Ma'an"]


def city_of(addr):
    for c in CITIES:
        if c.lower() in (addr or "").lower():
            return c
    return "Amman"


# The export lumps supplier trades into the same "Manufacturers" column as cuisines.
NOT_CUISINES = {
    "equipment", "packaging", "cleaning and hygiene products", "dairy products",
    "meats and poultry products", "nonalcoholic beverages", "alcoholic beverages",
    "vegetables and fruits", "indoor furnishings", "amusement parks and recreation",
    "patrons", "others",
}

# Hand-picked for the mockups: recognisable names with usable photography.
FEATURED = [
    "Reem Al Bawadi", "Fakhreldin", "Zaatar W Zeit", "Shams El Balad",
    "Romero Restaurant", "Peking", "Vintage Restaurant", "Abu Jbara",
    "Arabica Jordan", "Al Mankal", "Ararat Restaurant", "Fame Restaurant",
]


FEATURES = ["Accept Booking", "Outdoor dining", "Indoor dining", "Parking", "Delivery",
            "Good for groups", "Family place", "Kids friendly", "Casual dress",
            "Credit card accepted", "Reservations", "Shisha (Argeeleh)",
            "Serves alcohol", "Live music", "Soft music", "Catering",
            "Wheelchair accessible", "Breakfast", "Lunch", "Dinner"]


def is_dining(r):
    # Picture1 is always the venue logo; Picture2/3 are the actual photography,
    # so an entry is only usable in a photo-led layout if it has at least two.
    return (len(r["images"]) >= 2 and r["cuisine"]
            and r["cuisine"].lower() not in NOT_CUISINES
            and r["category"] == "Restaurants")


def main():
    restaurants = parse_restaurants()
    by_name = {r["name"].lower(): r for r in restaurants}

    featured = []
    for want in FEATURED:
        r = by_name.get(want.lower())
        if r and is_dining(r):
            featured.append(r)
    # top up with any other well-photographed dining entry, keeping cuisines varied
    used = {r["cuisine"] for r in featured}
    for r in restaurants:
        if len(featured) >= 12:
            break
        if is_dining(r) and r not in featured and r["cuisine"] not in used:
            featured.append(r)
            used.add(r["cuisine"])

    for r in featured:
        r["city"] = city_of(r["address"])
        r["logo"] = r["images"][0]
        r["image"] = r["images"][1]
        r["image2"] = r["images"][2] if len(r["images"]) > 2 else r["images"][1]
        r.pop("images", None)
        r["tags"] = r["tags"][:4]

    payload = {
        "restaurants": featured[:12],
        "cuisines": parse_column("manufacturers.xlsx"),
        "cities": CITIES,
        # 214 raw tags is filter soup; use the curated set the live site surfaces.
        "features": FEATURES,
        "totalRestaurants": len(restaurants),
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// Generated by tools/extract.py from the nopCommerce xlsx exports.\n")
        f.write("// Photos are hotlinked from jra.jo for mockup purposes only.\n")
        f.write("const JRA_DATA = ")
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print("restaurants parsed:", len(restaurants))
    print("featured written:", len(payload["restaurants"]))
    for r in payload["restaurants"]:
        print("  -", r["name"], "|", r["cuisine"], "|", r["city"], "|", r["image"][-40:])
    print("cuisines:", len(payload["cuisines"]), "features:", len(payload["features"]))
    print("->", OUT)


if __name__ == "__main__":
    main()
