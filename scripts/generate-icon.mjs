/**
 * Kalyo PWA icon — with full text branding.
 * Run: node scripts/generate-icon.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/icons";
await mkdir(OUT, { recursive: true });

// ── 512 × 512 — full branded icon ────────────────────────────────────────────
const SVG_512 = `<svg width="512" height="512" viewBox="0 0 512 512"
     xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="sky" cx="50%" cy="35%" r="65%">
    <stop offset="0%"   stop-color="#6EC4E4"/>
    <stop offset="100%" stop-color="#3E8FB5"/>
  </radialGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#FFFFFF"/>
    <stop offset="100%" stop-color="#EBF2FA"/>
  </linearGradient>
  <linearGradient id="roofG" x1="0.5" y1="0" x2="0.1" y2="1">
    <stop offset="0%"   stop-color="#555F6E"/>
    <stop offset="100%" stop-color="#38424F"/>
  </linearGradient>
  <linearGradient id="crossG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#F05A2A"/>
    <stop offset="100%" stop-color="#CC3910"/>
  </linearGradient>
  <!-- Dark bottom band for text legibility -->
  <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="rgba(4,26,54,0)"/>
    <stop offset="40%"  stop-color="rgba(4,26,54,0.72)"/>
    <stop offset="100%" stop-color="rgba(4,26,54,0.88)"/>
  </linearGradient>
</defs>

<!-- ── Background ───────────────────────────────────────────────── -->
<rect width="512" height="512" fill="url(#sky)"/>

<!-- Faint hex blockchain texture in sky -->
<g opacity="0.07" fill="none" stroke="white" stroke-width="1.4">
  <polygon points="256,16 294,38 294,82 256,104 218,82 218,38"/>
  <polygon points="146,66 184,88 184,132 146,154 108,132 108,88"/>
  <polygon points="366,66 404,88 404,132 366,154 328,132 328,88"/>
  <polygon points="74,152 112,174 112,218 74,240 36,218 36,174"/>
  <polygon points="438,152 476,174 476,218 438,240 400,218 400,174"/>
</g>

<!-- ── House body ────────────────────────────────────────────────── -->
<rect x="96" y="216" width="320" height="170" rx="4" fill="url(#wall)"/>

<!-- ── Roof ──────────────────────────────────────────────────────── -->
<!-- Wide overhang: left=44, right=468, peak y=96 -->
<polygon points="256,96 468,228 44,228" fill="url(#roofG)"/>
<!-- Roof eave shadow -->
<polygon points="256,96 468,228 44,228 48,234 256,103 464,234"
  fill="rgba(10,20,35,0.18)"/>

<!-- ── Medical cross ──────────────────────────────────────────────── -->
<!-- Centre of house body: x=256, y=301 -->
<!-- shadow -->
<rect x="241" y="235" width="34" height="114" rx="6" fill="rgba(0,0,0,0.1)"/>
<rect x="197" y="270" width="120" height="42" rx="6" fill="rgba(0,0,0,0.1)"/>
<!-- arms -->
<rect x="237" y="230" width="38" height="118" rx="7" fill="url(#crossG)"/>
<rect x="193" y="264" width="126" height="44" rx="7" fill="url(#crossG)"/>
<!-- highlight -->
<rect x="244" y="235" width="11" height="105" rx="4" fill="rgba(255,255,255,0.24)"/>
<rect x="198" y="271" width="108" height="11" rx="4" fill="rgba(255,255,255,0.24)"/>

<!-- ── Dark gradient band — text zone ──────────────────────────────── -->
<rect x="0" y="330" width="512" height="182" fill="url(#band)"/>

<!-- ── Text branding ─────────────────────────────────────────────── -->

<!-- "KALYO" — main brand name, large and bold -->
<text x="256" y="403"
  text-anchor="middle"
  font-family="Arial Black, Arial, sans-serif"
  font-size="82"
  font-weight="900"
  letter-spacing="6"
  fill="#FFFFFF">KALYO</text>

<!-- "APP" — smaller superscript beside implied by layout -->
<!-- "A BARANGAY HEALTH CENTER SYSTEM" -->
<text x="256" y="434"
  text-anchor="middle"
  font-family="Arial, Helvetica, sans-serif"
  font-size="19"
  font-weight="400"
  letter-spacing="3.5"
  fill="rgba(255,255,255,0.82)">A BARANGAY HEALTH CENTER SYSTEM</text>

<!-- Thin divider -->
<line x1="140" y1="448" x2="372" y2="448"
  stroke="rgba(56,189,248,0.45)" stroke-width="1"/>

<!-- "BLOCKCHAIN" — teal accent, stands out -->
<text x="256" y="478"
  text-anchor="middle"
  font-family="Arial Black, Arial, sans-serif"
  font-size="26"
  font-weight="900"
  letter-spacing="6"
  fill="#38BDF8">BLOCKCHAIN</text>

<!-- Small chain nodes flanking BLOCKCHAIN text -->
<g opacity="0.55" fill="none" stroke="#38BDF8" stroke-width="2">
  <circle cx="108" cy="470" r="7"/>
  <circle cx="122" cy="470" r="7"/>
  <line x1="115" y1="470" x2="115" y2="470"/>
  <circle cx="390" cy="470" r="7"/>
  <circle cx="404" cy="470" r="7"/>
</g>

</svg>`;

// ── 192 × 192 — condensed: keep all text but tighter ─────────────────────────
// Same design, just rendered smaller via resize
// ── Generate all sizes ────────────────────────────────────────────────────────

const buf512 = Buffer.from(SVG_512);

for (const { size, out } of [
  { size: 512, out: "icon-512.png" },
  { size: 512, out: "icon-maskable-512.png" },
  { size: 192, out: "icon-192.png" },
  { size: 180, out: "apple-touch-icon.png" },
]) {
  await sharp(buf512, { density: 144 })
    .resize(size, size)
    .png()
    .toFile(`${OUT}/${out}`);
  console.log(`  ✓ ${out}`);
}

console.log("Done.");
