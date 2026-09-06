// Generates app/icon-192.png and app/icon-512.png with no dependencies.
// A macro split ring: the three macros as arcs, which is what the app is for.
// Full-bleed background with the mark inside the maskable safe zone, so Android
// can round or mask it without clipping anything.
//
// Same hand-rolled PNG encoder as the Receipts app, plus 3x supersampling so
// the curves are anti-aliased rather than stair-stepped.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };

function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// App palette, from macro.html
const INK = [27, 24, 21];        // #1B1815 background
const TERRA = [200, 90, 48];     // #C85A30 protein
const CREAM = [244, 239, 230];   // #F4EFE6 carbs
const GREEN = [88, 112, 73];     // #587049 fat

// Arc spans as fractions of the ring, in draw order from 12 o'clock clockwise.
const SEGMENTS = [
  { frac: 0.40, colour: TERRA },
  { frac: 0.34, colour: CREAM },
  { frac: 0.26, colour: GREEN }
];
const GAP = 0.018;   // gap between segments, as a fraction of the circle

function draw(size) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const rOuter = s * 0.365;
  const rInner = s * 0.222;
  const SS = 3;                       // supersample factor

  // Precompute segment bounds in turns, starting at 12 o'clock.
  const bounds = [];
  let at = 0;
  for (const seg of SEGMENTS) {
    bounds.push({ from: at + GAP / 2, to: at + seg.frac - GAP / 2, colour: seg.colour });
    at += seg.frac;
  }

  const sampleAt = (px, py) => {
    const dx = px - cx, dy = py - cy;
    const r = Math.hypot(dx, dy);
    if (r < rInner || r > rOuter) return INK;
    // Turns clockwise from 12 o'clock.
    let turn = (Math.atan2(dx, -dy) / (Math.PI * 2));
    if (turn < 0) turn += 1;
    for (const b of bounds) if (turn >= b.from && turn < b.to) return b.colour;
    return INK;
  };

  return png(s, (x, y) => {
    let r = 0, g = 0, b = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const c = sampleAt(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
        r += c[0]; g += c[1]; b += c[2];
      }
    }
    const n = SS * SS;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

const out = path.join(__dirname, '..', 'app');
for (const s of [192, 512]) {
  fs.writeFileSync(path.join(out, `icon-${s}.png`), draw(s));
  console.log('wrote', `icon-${s}.png`);
}
