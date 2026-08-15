/**
 * Hero background media.
 *
 * Stock footage from Pexels (free licence, no attribution required, though the
 * author is recorded here because the association will want it on file).
 * Hotlinked, consistent with the photography — self-hosting all media is
 * flagged as production work in mockups/HANDOFF.md.
 *
 * Two sources are declared so the browser picks by viewport rather than always
 * pulling the 1080p file: phones get the 720p cut at roughly half the bytes.
 */
export const heroVideo = {
  /** https://www.pexels.com/video/-14534903/ */
  credit: "Sururi Ballıdağ / Pexels",
  description: "Restaurant interior, warm lighting",
  poster:
    "https://images.pexels.com/videos/14534903/pexels-photo-14534903.jpeg?auto=compress&cs=tinysrgb&w=1920",
  sources: [
    {
      src: "https://videos.pexels.com/video-files/14534903/14534903-hd_1920_1080_25fps.mp4",
      type: "video/mp4",
      /** ~7.8 MB */
      media: "(min-width: 900px)",
    },
    {
      src: "https://videos.pexels.com/video-files/14534903/14534903-hd_1280_720_25fps.mp4",
      type: "video/mp4",
      /** ~4.0 MB */
      media: undefined,
    },
  ],
} as const;
