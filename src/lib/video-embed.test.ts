import { describe, expect, it } from "vitest";
import { toVideoEmbed } from "./video-embed";

/**
 * The point of this function is that an admin can paste whatever the Share
 * button handed them. These are the shapes that actually come off YouTube and
 * Vimeo, plus the ones that must not be accepted.
 */
describe("toVideoEmbed", () => {
  const ID = "dQw4w9WgXcQ";

  it.each([
    ["watch URL", `https://www.youtube.com/watch?v=${ID}`],
    ["watch URL with extra params", `https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`],
    ["short link", `https://youtu.be/${ID}`],
    ["short link with timestamp", `https://youtu.be/${ID}?t=42`],
    ["shorts", `https://www.youtube.com/shorts/${ID}`],
    ["mobile", `https://m.youtube.com/watch?v=${ID}`],
    ["already an embed", `https://www.youtube.com/embed/${ID}`],
    ["no-www", `https://youtube.com/watch?v=${ID}`],
  ])("accepts a YouTube %s", (_label, url) => {
    const out = toVideoEmbed(url);
    expect(out?.provider).toBe("youtube");
    expect(out?.src).toContain(ID);
  });

  it("embeds YouTube through the no-cookie host", () => {
    // It should not set a tracking cookie before the visitor presses play.
    expect(toVideoEmbed(`https://youtu.be/${ID}`)?.src).toContain("youtube-nocookie.com");
  });

  it.each([
    ["page", "https://vimeo.com/123456789"],
    ["channel path", "https://vimeo.com/channels/staffpicks/123456789"],
    ["player URL", "https://player.vimeo.com/video/123456789"],
  ])("accepts a Vimeo %s", (_label, url) => {
    const out = toVideoEmbed(url);
    expect(out?.provider).toBe("vimeo");
    expect(out?.src).toBe("https://player.vimeo.com/video/123456789");
  });

  it.each([
    ["empty", ""],
    ["whitespace", "   "],
    ["null", null],
    ["not a URL", "just some words"],
    ["a YouTube channel, not a video", "https://www.youtube.com/user/JoRestaurants"],
    ["an id of the wrong length", "https://www.youtube.com/watch?v=tooshort"],
    ["an unrelated host", "https://example.com/video/123"],
    // A javascript: URL in an iframe src is the reason this returns null
    // rather than passing anything through.
    ["a javascript URL", "javascript:alert(1)"],
  ])("rejects %s", (_label, url) => {
    expect(toVideoEmbed(url)).toBeNull();
  });
});
