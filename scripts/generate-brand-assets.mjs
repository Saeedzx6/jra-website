/**
 * Generates the brand raster assets that the site references but did not ship:
 * the social share card and the icon set.
 *
 * Kept as a script rather than hand-made binaries so the assets can be
 * regenerated when the logo changes, and so the choices below are reviewable.
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Two things worth knowing before editing:
 *
 * 1. The logo is dark artwork on a transparent ground, so it disappears on the
 *    brand navy. Everything here reverses it out — the alpha channel is kept
 *    and the colour channels are forced to white, which preserves the
 *    anti-aliased edges instead of producing a hard-cut silhouette.
 *
 * 2. `jra-mark.png` is only 68x61. It is upscaled for the icons, which is
 *    acceptable because icons are displayed at 16-64px, but it is why the
 *    apple-touch icon is not sharper. A vector source from JRA would fix that.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const NAVY = "#173156";
const BRASS = "#b08d4f";

/** Recolours artwork to solid white, keeping its alpha channel intact. */
async function reverseOut(src) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function socialCard() {
  const W = 1200;
  const H = 630;

  const logo = await sharp(await reverseOut("public/brand/jra-logo.png"))
    .resize({ width: 460, kernel: "lanczos3" })
    .toBuffer();

  // Text is drawn as SVG rather than composited from images so it stays crisp.
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${NAVY}"/>
    <rect x="0" y="${H - 12}" width="${W}" height="12" fill="${BRASS}"/>
    <text x="80" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="62"
          font-weight="600" fill="#ffffff">The official platform of</text>
    <text x="80" y="404" font-family="Georgia, 'Times New Roman', serif" font-size="62"
          font-weight="600" fill="#ffffff">Jordan&#8217;s restaurant sector</text>
    <text x="80" y="486" font-family="'Segoe UI', Arial, sans-serif" font-size="27"
          letter-spacing="1.5" fill="#9fb3ce">Directory &#183; Classification &#183; Membership &#183; Training</text>
  </svg>`;

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: 92, left: 80 }])
    .png()
    .toFile("public/brand/og-default.png");

  console.log("public/brand/og-default.png  1200x630");
}

/**
 * The stock favicon was the bare mark: thin blue line art on transparency,
 * which at 16px reads as an empty tab. Reversed out on the brand navy it keeps
 * its shape at every size a browser actually renders it.
 */
async function icons() {
  for (const [file, size, pad] of [
    ["src/app/icon.png", 96, 0.16],
    ["src/app/apple-icon.png", 180, 0.2],
  ]) {
    const inner = Math.round(size * (1 - pad * 2));
    const mark = await sharp(await reverseOut("public/brand/jra-mark.png"))
      .resize({ width: inner, kernel: "lanczos3" })
      .toBuffer();
    const { height } = await sharp(mark).metadata();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: NAVY,
      },
    })
      .composite([
        {
          input: mark,
          top: Math.round((size - height) / 2),
          left: Math.round((size - inner) / 2),
        },
      ])
      .png()
      .toFile(file);

    console.log(`${file}  ${size}x${size}`);
  }
}

await mkdir("public/brand", { recursive: true });
await socialCard();
await icons();
