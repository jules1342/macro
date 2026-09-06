// Renders candidate icons to a folder for review. Same encoder as icons.js.
// Usage: node icon-options.js <outDir> [size]
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const crcT = (() => { const t=[]; for (let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xedb88320^(c>>>1) : c>>>1; t[n]=c>>>0;} return t; })();
const crc32 = (b) => { let c=0xffffffff; for (let i=0;i<b.length;i++) c=crcT[(c^b[i])&0xff]^(c>>>8); return (c^0xffffffff)>>>0; };
const chunk = (t,d) => { const l=Buffer.alloc(4); l.writeUInt32BE(d.length); const td=Buffer.concat([Buffer.from(t),d]); const c=Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([l,td,c]); };
function png(size, px) {
  const raw = Buffer.alloc((size*3+1)*size);
  for (let y=0;y<size;y++){ raw[y*(size*3+1)]=0; for (let x=0;x<size;x++){ const [r,g,b]=px(x,y); const o=y*(size*3+1)+1+x*3; raw[o]=r; raw[o+1]=g; raw[o+2]=b; } }
  const ih=Buffer.alloc(13); ih.writeUInt32BE(size,0); ih.writeUInt32BE(size,4); ih[8]=8; ih[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',ih), chunk('IDAT',zlib.deflateSync(raw)), chunk('IEND',Buffer.alloc(0))]);
}
const INK=[27,24,21], CREAM=[244,239,230], TERRA=[200,90,48], GREEN=[88,112,73], SAND=[229,221,208], MUTED=[108,101,92];

// Shapes in unit space (0..1). Each returns true if (x,y) is inside.
const disc = (cx,cy,r) => (x,y) => Math.hypot(x-cx,y-cy) <= r;
const ring = (cx,cy,ri,ro) => (x,y) => { const d=Math.hypot(x-cx,y-cy); return d>=ri && d<=ro; };
const ellipse = (cx,cy,rx,ry,ang=0) => (x,y) => { const c=Math.cos(-ang), s=Math.sin(-ang); const dx=x-cx, dy=y-cy; const u=dx*c-dy*s, v=dx*s+dy*c; return (u*u)/(rx*rx)+(v*v)/(ry*ry) <= 1; };
const rect = (x0,y0,x1,y1) => (x,y) => x>=x0 && x<=x1 && y>=y0 && y<=y1;
const rrect = (x0,y0,x1,y1,r) => (x,y) => { if (x<x0||x>x1||y<y0||y>y1) return false; const cx=Math.min(Math.max(x,x0+r),x1-r), cy=Math.min(Math.max(y,y0+r),y1-r); return Math.hypot(x-cx,y-cy)<=r; };
const seg = (x0,y0,x1,y1,w) => (x,y) => { const dx=x1-x0, dy=y1-y0; const t=Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/(dx*dx+dy*dy))); return Math.hypot(x-(x0+t*dx), y-(y0+t*dy)) <= w/2; };
const arc = (cx,cy,ri,ro,from,to) => (x,y) => { const d=Math.hypot(x-cx,y-cy); if (d<ri||d>ro) return false; let t=Math.atan2(x-cx,-(y-cy))/(2*Math.PI); if (t<0) t+=1; return t>=from && t<=to; };
const halfDiscBottom = (cx,cy,r) => (x,y) => y>=cy && Math.hypot(x-cx,y-cy)<=r;

const OPTIONS = {
  // A. Fork and knife, side by side, on a plate. Light.
  'A-cutlery': { bg: CREAM, layers: [
    [disc(0.5,0.52,0.34), TERRA],
    [disc(0.5,0.52,0.29), [251,248,242]],
    // fork, left: handle, neck, three tines
    [seg(0.40,0.72,0.40,0.46,0.05), INK],
    [rrect(0.33,0.40,0.47,0.48,0.03), INK],
    [seg(0.345,0.44,0.345,0.30,0.032), INK],
    [seg(0.40,0.44,0.40,0.29,0.032), INK],
    [seg(0.455,0.44,0.455,0.30,0.032), INK],
    // knife, right: handle and blade
    [seg(0.60,0.72,0.60,0.46,0.05), INK],
    [ellipse(0.605,0.375,0.045,0.11,0), INK],
  ]},
  // B. Three bars, a tracker mark. Dark.
  'B-bars': { bg: INK, layers: [
    [rrect(0.22,0.40,0.36,0.78,0.04), TERRA],
    [rrect(0.43,0.24,0.57,0.78,0.04), CREAM],
    [rrect(0.64,0.52,0.78,0.78,0.04), GREEN],
  ]},
  // C. Apple. Light.
  'C-apple': { bg: CREAM, layers: [
    [disc(0.42,0.56,0.235), TERRA], [disc(0.58,0.56,0.235), TERRA],
    [rect(0.42,0.40,0.58,0.62), TERRA],
    [seg(0.5,0.40,0.5,0.28,0.045), INK],
    [ellipse(0.60,0.30,0.11,0.045,-0.6), GREEN],
  ]},
  // D. Fried egg on a plate. Dark. A nod to the extra-large egg.
  'D-egg': { bg: INK, layers: [
    [disc(0.5,0.52,0.37), SAND],
    [disc(0.5,0.52,0.32), CREAM],
    [ellipse(0.49,0.53,0.235,0.20,0.3), [255,252,246]],
    [ellipse(0.53,0.50,0.22,0.185,-0.5), [255,252,246]],
    [disc(0.53,0.52,0.105), TERRA],
    [disc(0.505,0.495,0.03), [232,150,110]],
  ]},
  // E. Gauge dial with needle. Terracotta.
  'E-gauge': { bg: TERRA, layers: [
    [arc(0.5,0.58,0.26,0.36,0.62,1.0), CREAM], [arc(0.5,0.58,0.26,0.36,0.0,0.38), CREAM],
    [arc(0.5,0.58,0.26,0.36,0.62,0.75), [240,214,196]],
    [seg(0.5,0.58,0.63,0.36,0.055), INK],
    [disc(0.5,0.58,0.06), INK],
  ]},
};

const outDir = process.argv[2] || __dirname, size = +(process.argv[3] || 256), SS = 3;
for (const [name, def] of Object.entries(OPTIONS)) {
  const sample = (x,y) => { let c = def.bg; for (const [shape,colour] of def.layers) if (shape(x,y)) c = colour; return c; };
  const buf = png(size, (px,py) => { let r=0,g=0,b=0; for (let sy=0;sy<SS;sy++) for (let sx=0;sx<SS;sx++){ const c=sample((px+(sx+0.5)/SS)/size,(py+(sy+0.5)/SS)/size); r+=c[0]; g+=c[1]; b+=c[2]; } const n=SS*SS; return [Math.round(r/n),Math.round(g/n),Math.round(b/n)]; });
  fs.writeFileSync(path.join(outDir, `icon-option-${name}.png`), buf);
  console.log('wrote', `icon-option-${name}.png`);
}
