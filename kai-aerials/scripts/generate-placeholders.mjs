/**
 * Maakt tijdelijke voorbeeldafbeeldingen in public/images.
 * Vervang deze bestanden later door je eigen dronebeelden; behoud de namen,
 * dan hoef je verder niets aan te passen.
 *
 *   node scripts/generate-placeholders.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "images");

/** Pseudo-willekeurig maar reproduceerbaar. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function labelOverlay(label, w = 1600, h = 1000) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <g font-family="Helvetica, Arial, sans-serif">
        <rect x="40" y="${h - 96}" width="${24 + label.length * 11}" height="44" rx="22" fill="#04070d" opacity="0.66"/>
        <text x="60" y="${h - 67}" fill="#dbe6f5" font-size="20" letter-spacing="1.1">${label}</text>
      </g>
    </svg>`,
  );
}

function scene({ seed, palette, kind }) {
  const r = rng(seed);
  const w = 1600;
  const h = 1000;
  const parts = [];

  parts.push(`<rect width="${w}" height="${h}" fill="url(#sky)"/>`);

  if (kind === "landscape" || kind === "coast") {
    // Velden of water in perspectief.
    let y = h * 0.42;
    let band = 26;
    let i = 0;
    while (y < h) {
      const tone = palette.ground[i % palette.ground.length];
      const next = Math.min(h, y + band);
      const skew = (r() - 0.5) * 160;
      parts.push(
        `<path d="M${-100 + skew} ${y} L${w + 100} ${y - 12} L${w + 100} ${next} L${-100 + skew} ${next + 10} Z" fill="${tone}" opacity="${0.85 - i * 0.02}"/>`,
      );
      y = next;
      band *= 1.18;
      i++;
    }
    // Slingerende weg of rivier.
    parts.push(
      `<path d="M${w * 0.1} ${h} C ${w * 0.35} ${h * 0.8}, ${w * 0.3} ${h * 0.6}, ${w * 0.52} ${h * 0.44}" stroke="${palette.accent}" stroke-width="${kind === "coast" ? 42 : 16}" fill="none" opacity="0.55" stroke-linecap="round"/>`,
    );
  }

  if (kind === "city" || kind === "estate" || kind === "event") {
    // Grondvlak.
    parts.push(
      `<rect y="${h * 0.38}" width="${w}" height="${h * 0.62}" fill="${palette.ground[0]}"/>`,
    );
    const count = kind === "estate" ? 7 : 22;
    for (let i = 0; i < count; i++) {
      const bw = 60 + r() * (kind === "estate" ? 190 : 120);
      const bh = 60 + r() * (kind === "estate" ? 120 : 320);
      const x = r() * (w + 200) - 100;
      const y = h * (0.46 + r() * 0.42) - bh * 0.25;
      const tone = palette.ground[(i % (palette.ground.length - 1)) + 1];
      parts.push(
        `<g opacity="${0.55 + r() * 0.4}"><rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${tone}" rx="4"/>` +
          `<rect x="${x}" y="${y}" width="${bw}" height="${Math.min(18, bh * 0.14)}" fill="${palette.accent}" opacity="0.35"/></g>`,
      );
    }
    if (kind === "event") {
      for (let i = 0; i < 40; i++) {
        parts.push(
          `<circle cx="${r() * w}" cy="${h * (0.55 + r() * 0.42)}" r="${2 + r() * 4}" fill="${palette.accent}" opacity="${0.3 + r() * 0.5}"/>`,
        );
      }
    }
  }

  // Lichte nevel en gloed rond de horizon, zodat de overgang zacht is.
  parts.push(
    `<ellipse cx="${w * 0.5}" cy="${h * 0.4}" rx="${w * 0.75}" ry="${h * 0.16}" fill="url(#glow)"/>`,
  );
  parts.push(
    `<rect y="${h * 0.26}" width="${w}" height="${h * 0.3}" fill="url(#haze)"/>`,
  );
  // Vignet voor een rustiger beeld.
  parts.push(`<rect width="${w}" height="${h}" fill="url(#vignette)"/>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.sky[0]}"/>
      <stop offset="60%" stop-color="${palette.sky[1]}"/>
      <stop offset="100%" stop-color="${palette.sky[2]}"/>
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.sky[2]}" stop-opacity="0"/>
      <stop offset="45%" stop-color="${palette.sky[2]}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${palette.sky[2]}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>
  ${parts.join("\n  ")}
</svg>`;
  return svg;
}

const SCENES = [
  {
    file: "hero.jpg",
    kind: "city",
    label: "Voorbeeldbeeld — vervang door je eigen dronefoto",
    palette: {
      sky: ["#070b14", "#14263f", "#2c4f79"],
      ground: ["#0d1826", "#132435", "#1a3047", "#213a55"],
      accent: "#6fb1ff",
    },
    seed: 11,
  },
  {
    file: "about.jpg",
    kind: "landscape",
    label: "Voorbeeldbeeld",
    palette: {
      sky: ["#0a1018", "#1a2b3d", "#37556f"],
      ground: ["#16242a", "#1c3030", "#233b34", "#2b4639"],
      accent: "#7cc0ff",
    },
    seed: 29,
  },
  {
    file: "project-vastgoed-1.jpg",
    kind: "estate",
    label: "Voorbeeldproject",
    palette: {
      sky: ["#080d16", "#1b2c44", "#3a5c82"],
      ground: ["#131f2b", "#1b2c38", "#243746", "#2d4453"],
      accent: "#8cc4ff",
    },
    seed: 41,
  },
  {
    file: "project-vastgoed-2.jpg",
    kind: "estate",
    label: "Voorbeeldproject",
    palette: {
      sky: ["#0a0f18", "#22344b", "#476a8f"],
      ground: ["#182430", "#20313d", "#293c4a", "#334857"],
      accent: "#9fd0ff",
    },
    seed: 57,
  },
  {
    file: "project-bedrijven-1.jpg",
    kind: "city",
    label: "Voorbeeldproject",
    palette: {
      sky: ["#070c15", "#16273d", "#2f4e73"],
      ground: ["#101b27", "#182533", "#1f2f40", "#27394c"],
      accent: "#7ab6ff",
    },
    seed: 73,
  },
  {
    file: "project-bedrijven-2.jpg",
    kind: "city",
    label: "Voorbeeldproject",
    palette: {
      sky: ["#090d15", "#1a2a3c", "#3c5a76"],
      ground: ["#141d26", "#1c2733", "#25333f", "#2e3f4c"],
      accent: "#86c2ff",
    },
    seed: 89,
  },
  {
    file: "project-evenementen-1.jpg",
    kind: "event",
    label: "Voorbeeldproject",
    palette: {
      sky: ["#0b0a16", "#221c3a", "#3f3560"],
      ground: ["#161425", "#1e1b31", "#26223d", "#2f2a4a"],
      accent: "#a892ff",
    },
    seed: 103,
  },
  {
    file: "project-natuur-1.jpg",
    kind: "landscape",
    label: "Voorbeeldproject",
    palette: {
      sky: ["#09100f", "#1a2d26", "#39604d"],
      ground: ["#14241c", "#1a3024", "#213c2c", "#294935"],
      accent: "#7fd6a8",
    },
    seed: 127,
  },
  {
    file: "project-natuur-2.jpg",
    kind: "coast",
    label: "Voorbeeldproject",
    palette: {
      sky: ["#070f18", "#163049", "#2f5f7f"],
      ground: ["#0f2430", "#143040", "#1a3c4f", "#20485e"],
      accent: "#6fd0ff",
    },
    seed: 149,
  },
  {
    file: "gallery-1.jpg",
    kind: "landscape",
    label: "Voorbeeldbeeld",
    palette: {
      sky: ["#0a0f18", "#1d2f45", "#3d5d80"],
      ground: ["#152028", "#1c2a33", "#24353f", "#2c414c"],
      accent: "#8fc6ff",
    },
    seed: 163,
  },
  {
    file: "gallery-2.jpg",
    kind: "city",
    label: "Voorbeeldbeeld",
    palette: {
      sky: ["#080c14", "#18263a", "#31506f"],
      ground: ["#111a24", "#18232e", "#1f2d3a", "#273746"],
      accent: "#7db9ff",
    },
    seed: 181,
  },
  {
    file: "gallery-3.jpg",
    kind: "coast",
    label: "Voorbeeldbeeld",
    palette: {
      sky: ["#060e16", "#123046", "#2a6080"],
      ground: ["#0d222e", "#122d3c", "#17384b", "#1d4459"],
      accent: "#69cfff",
    },
    seed: 199,
  },
];

await fs.mkdir(OUT, { recursive: true });
for (const s of SCENES) {
  const svg = scene(s);
  const base = await sharp(Buffer.from(svg))
    .blur(2.2)
    .modulate({ saturation: 1.08, brightness: 1.18 })
    .png()
    .toBuffer();
  await sharp(base)
    .composite([{ input: labelOverlay(s.label), top: 0, left: 0 }])
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(OUT, s.file));
  console.log("geschreven:", s.file);
}

// Open Graph-beeld (1200x630) afgeleid van de hero.
await sharp(path.join(OUT, "hero.jpg"))
  .resize(1200, 630, { fit: "cover" })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(OUT, "og.jpg"));
console.log("geschreven: og.jpg");
