// Generates app/icon-192.png and app/icon-512.png with no dependencies.
// The mark is an apple in the app palette on the cream ground, full-bleed so
// Android can round or mask it without clipping. Hand-rolled PNG encoder,
// 3x supersampled. Candidate designs live in icon-options.js.
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
const INK=[27,24,21], CREAM=[244,239,230], TERRA=[200,90,48], GREEN=[88,112,73];
const disc = (cx,cy,r) => (x,y) => Math.hypot(x-cx,y-cy) <= r;
const ellipse = (cx,cy,rx,ry,ang=0) => (x,y) => { const c=Math.cos(-ang), s=Math.sin(-ang); const dx=x-cx, dy=y-cy; const u=dx*c-dy*s, v=dx*s+dy*c; return (u*u)/(rx*rx)+(v*v)/(ry*ry) <= 1; };
const rect = (x0,y0,x1,y1) => (x,y) => x>=x0 && x<=x1 && y>=y0 && y<=y1;
const seg = (x0,y0,x1,y1,w) => (x,y) => { const dx=x1-x0, dy=y1-y0; const t=Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/(dx*dx+dy*dy))); return Math.hypot(x-(x0+t*dx), y-(y0+t*dy)) <= w/2; };

const LAYERS = [
  [disc(0.42,0.56,0.235), TERRA], [disc(0.58,0.56,0.235), TERRA],
  [rect(0.42,0.40,0.58,0.62), TERRA],
  [seg(0.5,0.40,0.5,0.28,0.045), INK],
  [ellipse(0.60,0.30,0.11,0.045,-0.6), GREEN],
];
function draw(size) {
  const SS = 3;
  const sample = (x,y) => { let c = CREAM; for (const [shape,colour] of LAYERS) if (shape(x,y)) c = colour; return c; };
  return png(size, (px,py) => { let r=0,g=0,b=0; for (let sy=0;sy<SS;sy++) for (let sx=0;sx<SS;sx++){ const c=sample((px+(sx+0.5)/SS)/size,(py+(sy+0.5)/SS)/size); r+=c[0]; g+=c[1]; b+=c[2]; } const n=SS*SS; return [Math.round(r/n),Math.round(g/n),Math.round(b/n)]; });
}
const out = path.join(__dirname, '..', 'app');
for (const s of [192, 512]) { fs.writeFileSync(path.join(out, `icon-${s}.png`), draw(s)); console.log('wrote', `icon-${s}.png`); }
