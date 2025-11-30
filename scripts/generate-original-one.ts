import { PNG } from "npm:pngjs@7.0.0";

const OUTPUT_DIR = "AI_CONCEPT/assets/original-one";
const WIDTH = 128;
const HEIGHT = 128;

const ensureDir = async () => {
  await Deno.mkdir(OUTPUT_DIR, { recursive: true });
};

const setPixel = (
  png: PNG,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a = 255,
) => {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const idx = (WIDTH * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
};

const savePng = async (png: PNG, name: string) => {
  const buffer = PNG.sync.write(png);
  await Deno.writeFile(`${OUTPUT_DIR}/${name}.png`, buffer);
};

const coreFoundation = async () => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const norm = Math.min(1, dist / (WIDTH / 1.8));
      const angle = Math.atan2(dy, dx);
      const band = Math.abs(Math.sin(angle * 3.5));
      const star = Math.min(
        1,
        Math.abs(Math.sin(angle * 8)) * (1 - norm * 0.7),
      );

      const r = Math.min(255, Math.round(190 + (1 - norm) * 55 + band * 30));
      const g = Math.min(255, Math.round(70 + (1 - band) * 120 + norm * 20));
      const b = Math.min(255, Math.round(210 - norm * 90 + band * 50));

      const highlight = star * 40;
      setPixel(
        png,
        x,
        y,
        Math.min(255, r + highlight),
        Math.min(255, g + highlight),
        Math.min(255, b + highlight),
      );
    }
  }

  await savePng(png, "core-foundation");
};

const temporalOrbits = async () => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const base = 10 + dist * 0.4;
      setPixel(
        png,
        x,
        y,
        10,
        12,
        24 + Math.round(base * 0.3),
        255,
      );
    }
  }

  const arcColors = [
    [255, 214, 102],
    [79, 137, 255],
    [247, 99, 255],
    [94, 222, 148],
  ];

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const bandIndex = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 8);
      const color = arcColors[bandIndex % arcColors.length];
      const orbit = Math.abs(Math.sin((dist / 20) + bandIndex));
      const pulse = Math.abs(Math.sin(angle * 5));
      const mix = Math.min(1, orbit * 0.7 + pulse * 0.3);

      const idx = (WIDTH * y + x) << 2;
      png.data[idx] = Math.min(255, png.data[idx] + color[0] * mix * 0.7);
      png.data[idx + 1] = Math.min(
        255,
        png.data[idx + 1] + color[1] * mix * 0.7,
      );
      png.data[idx + 2] = Math.min(
        255,
        png.data[idx + 2] + color[2] * mix * 0.7,
      );
    }
  }

  await savePng(png, "temporal-orbits");
};

const sensorySpectrum = async () => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let y = 0; y < HEIGHT; y++) {
    const phase = y / HEIGHT;
    const baseR = 120 + Math.sin(phase * Math.PI) * 110;
    const baseG = 90 + Math.sin((phase + 0.33) * Math.PI) * 120;
    const baseB = 130 + Math.sin((phase + 0.66) * Math.PI) * 90;

    for (let x = 0; x < WIDTH; x++) {
      const mod = Math.sin((x / 18) + phase * 8);
      setPixel(
        png,
        x,
        y,
        Math.min(255, Math.max(0, baseR + mod * 30)),
        Math.min(255, Math.max(0, baseG + mod * 25)),
        Math.min(255, Math.max(0, baseB - mod * 40)),
      );
    }
  }

  for (let line = 1; line < 6; line++) {
    const y = Math.floor((line / 6) * HEIGHT);
    for (let x = 0; x < WIDTH; x++) {
      const pulse = Math.sin((x / 5) + line);
      const alpha = 140 + Math.round(pulse * 40);
      setPixel(png, x, y, 255, 255, 255, alpha);
    }
  }

  await savePng(png, "sensory-spectrum");
};

const actionField = async () => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const nx = (x / WIDTH) * 2 - 1;
      const ny = (y / HEIGHT) * 2 - 1;
      const magnitude = Math.sqrt(nx * nx + ny * ny);
      const angle = Math.atan2(ny, nx);
      const field = Math.sin(angle * 3) + Math.cos(magnitude * 5);
      const pulse = Math.sin((x + y) / 24);

      const r = Math.min(
        255,
        Math.max(0, 200 + field * 40 - magnitude * 60 + pulse * 25),
      );
      const g = Math.min(255, Math.max(0, 110 + magnitude * 90 + pulse * 10));
      const b = Math.min(
        255,
        Math.max(0, 190 - field * 45 + magnitude * 35 - pulse * 20),
      );

      setPixel(png, x, y, r, g, b);
    }
  }

  await savePng(png, "action-field");
};

const conceptLoop = async () => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const palette = [
    [255, 214, 102],
    [79, 137, 255],
    [196, 93, 255],
    [94, 222, 148],
    [255, 255, 255],
  ];

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      setPixel(png, x, y, 8, 8, 20);
    }
  }

  for (let i = 0; i < 320; i++) {
    const t = i / 320;
    const radius = 30 + 100 * t;
    const angle = t * Math.PI * 6;
    const x = Math.round(cx + Math.cos(angle) * radius);
    const y = Math.round(cy + Math.sin(angle) * radius);
    const [r, g, b] = palette[i % palette.length];
    const fade = 0.35 + 0.65 * t;

    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) continue;
        const falloff = Math.max(0, 1 - dist / 5);
        setPixel(
          png,
          x + dx,
          y + dy,
          Math.min(255, r * fade * falloff + 30),
          Math.min(255, g * fade * falloff + 20),
          Math.min(255, b * fade * falloff + 40),
          200,
        );
      }
    }
  }

  for (let ring = 0; ring < 10; ring++) {
    const padding = 30 + ring * 8;
    for (let deg = 0; deg < 360; deg++) {
      const rad = (deg / 180) * Math.PI;
      const x = Math.round(cx + Math.cos(rad) * (cx - padding));
      const y = Math.round(cy + Math.sin(rad) * (cy - padding * 0.8));
      const pulse = Math.sin((deg + ring * 15) * Math.PI / 180);
      setPixel(
        png,
        x,
        y,
        200 + Math.round(pulse * 40),
        200 + Math.round(pulse * -20),
        255,
        150,
      );
    }
  }

  await savePng(png, "concept-loop");
};

// Knowledge domain definitions
const DOMAINS = {
  stemScience: {
    center: { x: 0.25, y: 0.25 },
    color: [80, 160, 255],
    radius: 0.3,
  },
  stemMath: {
    center: { x: 0.20, y: 0.35 },
    color: [100, 200, 255],
    radius: 0.25,
  },
  artsLiterature: {
    center: { x: 0.70, y: 0.20 },
    color: [255, 200, 100],
    radius: 0.28,
  },
  artsPhilosophy: {
    center: { x: 0.80, y: 0.30 },
    color: [200, 150, 255],
    radius: 0.25,
  },
  socialHistory: {
    center: { x: 0.25, y: 0.70 },
    color: [255, 100, 150],
    radius: 0.28,
  },
  socialPsychology: {
    center: { x: 0.35, y: 0.80 },
    color: [230, 120, 200],
    radius: 0.25,
  },
  practicalHealth: {
    center: { x: 0.70, y: 0.70 },
    color: [120, 220, 140],
    radius: 0.26,
  },
  practicalSkills: {
    center: { x: 0.78, y: 0.82 },
    color: [160, 200, 100],
    radius: 0.23,
  },
  synthesisMeta: {
    center: { x: 0.50, y: 0.50 },
    color: [240, 240, 240],
    radius: 0.20,
  },
};

const generateUniversalKnowledge = async () => {
  const png = new PNG({ width: WIDTH, height: HEIGHT });

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const xNorm = x / (WIDTH - 1);
      const yNorm = y / (HEIGHT - 1);

      let totalWeight = 0;
      let r = 0, g = 0, b = 0;

      for (const domain of Object.values(DOMAINS)) {
        const dx = xNorm - domain.center.x;
        const dy = yNorm - domain.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.exp(
          -(dist * dist) / (domain.radius * domain.radius),
        );

        r += domain.color[0] * influence;
        g += domain.color[1] * influence;
        b += domain.color[2] * influence;
        totalWeight += influence;
      }

      if (totalWeight > 0) {
        r /= totalWeight;
        g /= totalWeight;
        b /= totalWeight;
      }

      const wave1 = Math.sin(xNorm * Math.PI * 8 + yNorm * Math.PI * 3) * 8;
      const wave2 = Math.cos(yNorm * Math.PI * 6 + xNorm * Math.PI * 4) * 6;
      const texture = wave1 + wave2;

      setPixel(png, x, y, r + texture, g + texture * 0.8, b + texture * 0.6);
    }
  }

  await savePng(png, "universal-knowledge");
};

const generate = async () => {
  console.log("Generating knowledge domain seed images...");
  await ensureDir();

  // Generate the 5 core images
  await coreFoundation(); // Maps to Mathematics & Logic
  await temporalOrbits(); // Maps to History & Culture
  await sensorySpectrum(); // Maps to Psychology & Behavior
  await actionField(); // Maps to Skills & How-To
  await conceptLoop(); // Maps to Understanding & Synthesis

  console.log("\n✨ All 5 knowledge domain images generated!");
  console.log(`Location: ${OUTPUT_DIR}/`);
  console.log(
    "\nThese images encode knowledge through color, pattern, and spatial properties.",
  );
};

if (import.meta.main) {
  await generate();
}
