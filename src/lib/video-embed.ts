/**
 * Turns a video URL as a person would paste it into one that can be embedded.
 *
 * An admin pastes whatever the browser address bar or the Share button gave
 * them. That is a watch URL, a youtu.be short link, a Shorts link, or a Vimeo
 * page — none of which render in an iframe. Asking someone to find the embed
 * URL themselves is asking them to open the developer tools of a video site.
 *
 * Returns null for anything unrecognised rather than guessing, so a mistyped
 * URL shows nothing instead of a broken player frame.
 */
export type VideoEmbed = { src: string; provider: "youtube" | "vimeo" };

/** YouTube ids are exactly 11 characters of URL-safe base64. */
const YT_ID = /^[\w-]{11}$/;

export function toVideoEmbed(raw: string | null | undefined): VideoEmbed | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return YT_ID.test(id) ? { src: youtube(id), provider: "youtube" } : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    // /watch?v=ID
    const v = url.searchParams.get("v");
    if (v && YT_ID.test(v)) return { src: youtube(v), provider: "youtube" };

    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["embed", "shorts", "live", "v"].includes(parts[0]!)) {
      const id = parts[1]!;
      if (YT_ID.test(id)) return { src: youtube(id), provider: "youtube" };
    }
    return null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    // The id is the first all-digit segment: /12345, /channels/x/12345,
    // /video/12345 all resolve the same way.
    const id = url.pathname.split("/").filter(Boolean).find((p) => /^\d+$/.test(p));
    return id ? { src: `https://player.vimeo.com/video/${id}`, provider: "vimeo" } : null;
  }

  return null;
}

/**
 * `youtube-nocookie.com` rather than `youtube.com`: it does not write a
 * tracking cookie until the visitor actually presses play. `rel=0` keeps the
 * end-cards to the same channel rather than offering whatever YouTube feels
 * like next, which on an association's page could be anything at all.
 */
function youtube(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}
