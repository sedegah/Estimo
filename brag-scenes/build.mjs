// Builds the six portrait scenes for the ESTIMO launch video, then screenshots them
// with headless Chrome at 1080x1920.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const out = path.join(root, "brag-output");
const scenesDir = path.join(root, "brag-scenes");
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(scenesDir, "build"), { recursive: true });

const brand = {
  navy: "#0B1F3F",
  deep: "#06142B",
  amber: "#F5B801",
  plaster: "#F1F2EE",
  ink: "#0B1F3F",
  muted: "#5F6B7A",
  line: "#E2E4DC",
};

const fontRegular = path.join(root, "public", "fonts", "bricolage-regular.ttf").replace(/\\/g, "/");
const fontBold = path.join(root, "public", "fonts", "bricolage-bold.ttf").replace(/\\/g, "/");
const logoWhite = path.join(root, "assets", "brand", "png", "estimo-logo-horizontal-dark.png").replace(/\\/g, "/");
const logoDark = path.join(root, "assets", "brand", "png", "estimo-logo-horizontal-light.png").replace(/\\/g, "/");
const mark = path.join(root, "assets", "brand", "png", "estimo-mark-light.png").replace(/\\/g, "/");

const shell = (body, styles = "") => `<!doctype html>
<html><head><meta charset="utf-8"><style>
@font-face { font-family: "Bricolage"; src: url("file:///${fontRegular}"); font-weight: 400; }
@font-face { font-family: "Bricolage"; src: url("file:///${fontBold}"); font-weight: 800; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; }
body { font-family: "Bricolage", sans-serif; color: ${brand.ink}; background: ${brand.plaster}; }
.wrap { position: relative; width: 1080px; height: 1920px; padding: 110px 96px; display: flex; flex-direction: column; }
.eyebrow { font-size: 26px; letter-spacing: 6px; text-transform: uppercase; font-weight: 800; }
h1 { font-size: 104px; line-height: 0.98; letter-spacing: -3px; margin: 0; font-weight: 800; }
h2 { font-size: 76px; line-height: 1.02; letter-spacing: -2px; margin: 0; font-weight: 800; }
p.lede { font-size: 38px; line-height: 1.45; margin: 26px 0 0; }
.navy { background: ${brand.navy}; color: #fff; }
.navy .eyebrow { color: ${brand.amber}; }
.amber { color: ${brand.amber}; }
.muted { color: ${brand.muted}; }
.card { background: #fff; border: 2px solid ${brand.line}; border-radius: 28px; padding: 46px 48px; }
.dark-card { background: rgba(255,255,255,0.06); border: 2px solid rgba(255,255,255,0.18); border-radius: 28px; padding: 46px 48px; }
.row { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.plan-line { stroke: #fff; stroke-width: 6; fill: none; }
.glow { filter: blur(26px); }
.footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; font-size: 24px; }
${styles}
</style></head><body>${body}</body></html>`;

const scenes = [];

// 1. Hook
scenes.push({
  name: "scene-1",
  html: shell(
    `<div class="wrap navy" style="justify-content:center; gap:52px">
      <div class="eyebrow">Estimo · Ghana</div>
      <h1>Picture it lit.</h1>
      <h1 class="amber">Then price it.</h1>
      <p class="lede" style="color:#C3CEE2; max-width:820px">A first electrical estimate, before the first cable is pulled.</p>
      <svg viewBox="0 0 620 430" style="width:100%; margin-top:40px">
        <defs><radialGradient id="g"><stop offset="0" stop-color="#F5B801" stop-opacity=".55"/><stop offset="1" stop-color="#F5B801" stop-opacity="0"/></radialGradient></defs>
        <circle cx="170" cy="130" r="160" fill="url(#g)"/><circle cx="470" cy="110" r="130" fill="url(#g)"/>
        <circle cx="185" cy="320" r="140" fill="url(#g)"/>
        <g class="plan-line"><rect x="20" y="20" width="580" height="390"/><path d="M340 20V150M340 200V410M20 210H190M240 210H600"/></g>
        <path d="M60 210V320H185M185 210V130H170" stroke="#F5B801" stroke-width="4" stroke-dasharray="4 12" fill="none" stroke-linecap="round"/>
        <g fill="#0B1F3F" stroke="#F5B801" stroke-width="4"><circle cx="170" cy="130" r="16"/><circle cx="470" cy="110" r="16"/><circle cx="185" cy="320" r="16"/></g>
        <g fill="#F5B801"><rect x="30" y="90" width="18" height="18"/><rect x="560" y="120" width="18" height="18"/></g>
      </svg>
    </div>`,
  ),
});

// 2. Describe the building
scenes.push({
  name: "scene-2",
  html: shell(
    `<div class="wrap" style="gap:44px; justify-content:center">
      <div class="eyebrow muted">Step one</div>
      <h2>Describe the building.</h2>
      <p class="lede muted">Pick the closest type, then count the rooms.</p>
      <div class="card" style="margin-top:26px">
        <div class="row" style="padding-bottom:28px; border-bottom:2px solid ${brand.line}">
          <div><div style="font-size:34px; font-weight:800">2-bedroom home</div><div class="muted" style="font-size:26px; margin-top:6px">Home · 5 spaces</div></div>
          <div style="background:${brand.amber}; border-radius:18px; padding:16px 24px; font-weight:800; font-size:28px">Selected</div>
        </div>
        <div class="row" style="padding:30px 0; border-bottom:2px solid ${brand.line}"><span style="font-size:34px">Living room</span><span style="font-size:34px; font-weight:800">1</span></div>
        <div class="row" style="padding:30px 0; border-bottom:2px solid ${brand.line}"><span style="font-size:34px">Bedrooms</span><span style="font-size:34px; font-weight:800">2</span></div>
        <div class="row" style="padding:30px 0; border-bottom:2px solid ${brand.line}"><span style="font-size:34px">Kitchen</span><span style="font-size:34px; font-weight:800">1</span></div>
        <div class="row" style="padding:30px 0"><span style="font-size:34px">Bathroom</span><span style="font-size:34px; font-weight:800">1</span></div>
      </div>
      <p class="lede" style="color:${brand.muted}">Every space brings its own lights, sockets and switches.</p>
      <div class="footer"><span class="muted">Estimo</span><img src="file:///${mark}" height="56"/></div>
    </div>`,
  ),
});

// 3. Material search
scenes.push({
  name: "scene-3",
  html: shell(
    `<div class="wrap navy" style="gap:40px; justify-content:center">
      <div class="eyebrow">Step two</div>
      <h2>Search the materials.</h2>
      <p class="lede" style="color:#C3CEE2">The way you would ask for it at the shop.</p>
      <div class="dark-card" style="margin-top:18px; font-size:30px; color:#8FA2C4">2.5mm cable</div>
      <div class="dark-card" style="padding:0; overflow:hidden">
        <div class="row" style="padding:34px 40px; border-bottom:1px solid rgba(255,255,255,.14)"><span style="font-size:32px">2.5mm twin and earth cable</span><span style="color:${brand.amber}; font-size:26px">Pending</span></div>
        <div class="row" style="padding:34px 40px; border-bottom:1px solid rgba(255,255,255,.14)"><span style="font-size:32px">Double socket outlet</span><span style="color:${brand.amber}; font-size:26px">Pending</span></div>
        <div class="row" style="padding:34px 40px; border-bottom:1px solid rgba(255,255,255,.14)"><span style="font-size:32px">32A single-pole MCB</span><span style="color:${brand.amber}; font-size:26px">Pending</span></div>
        <div class="row" style="padding:34px 40px"><span style="font-size:32px">Distribution board, 8-way</span><span style="color:${brand.amber}; font-size:26px">Pending</span></div>
      </div>
      <p class="lede" style="color:#C3CEE2">Unpriced stays visibly pending. Nothing is guessed.</p>
    </div>`,
  ),
});

// 4. The estimate
scenes.push({
  name: "scene-4",
  html: shell(
    `<div class="wrap" style="gap:34px; justify-content:center">
      <div class="eyebrow muted">Step three</div>
      <h2>Read the estimate.</h2>
      <div style="background:${brand.navy}; border-radius:32px; padding:56px 52px; color:#fff; margin-top:14px">
        <div style="font-size:28px; letter-spacing:3px; text-transform:uppercase; color:#8FA2C4">Estimated total</div>
        <div style="font-size:124px; font-weight:800; letter-spacing:-4px; margin-top:10px">GH<span style="color:${brand.amber}">₵</span>16,800</div>
        <div style="height:2px; background:rgba(255,255,255,.18); margin:34px 0"></div>
        ${[
          ["Cables and conduit", "4,200"],
          ["Sockets and switches", "3,600"],
          ["Light fittings", "2,800"],
          ["Board and breakers", "1,900"],
          ["Labour", "4,300"],
        ]
          .map(
            ([label, value]) =>
              `<div class="row" style="padding:16px 0; font-size:30px"><span style="color:#C3CEE2">${label}</span><span style="font-weight:800">${value}</span></div>`,
          )
          .join("")}
      </div>
      <p class="lede muted">A planning figure, not a quotation. Adjust the spaces and watch it move.</p>
      <div class="footer"><span class="muted">2-bedroom home · standard fittings</span></div>
    </div>`,
  ),
});

// 5. Admin console
scenes.push({
  name: "scene-5",
  html: shell(
    `<div class="wrap navy" style="gap:34px; justify-content:center">
      <div class="eyebrow">For the team</div>
      <h2>Prices update once.</h2>
      <p class="lede" style="color:#C3CEE2">The console keeps the catalogue honest. Every estimate follows.</p>
      <div class="dark-card" style="padding:0; overflow:hidden; margin-top:10px">
        <div style="padding:30px 40px; border-bottom:1px solid rgba(255,255,255,.14); font-size:26px; letter-spacing:3px; text-transform:uppercase; color:#8FA2C4">Prices · Admin</div>
        <div class="row" style="padding:30px 40px; border-bottom:1px solid rgba(255,255,255,.12)"><span style="font-size:30px">Double socket outlet</span><span style="font-family:monospace; font-size:30px; color:${brand.amber}">42.50</span></div>
        <div class="row" style="padding:30px 40px; border-bottom:1px solid rgba(255,255,255,.12)"><span style="font-size:30px">2.5mm cable, per metre</span><span style="font-family:monospace; font-size:30px; color:${brand.amber}">18.00</span></div>
        <div class="row" style="padding:34px 40px"><span style="font-size:28px; color:#C3CEE2">2 prices ready</span><span style="background:${brand.amber}; color:${brand.navy}; border-radius:16px; padding:18px 30px; font-weight:800; font-size:28px">Publish</span></div>
      </div>
      <p class="lede" style="color:#C3CEE2">Published prices appear on the site within a minute.</p>
    </div>`,
  ),
});

// 6. Outro
scenes.push({
  name: "scene-6",
  html: shell(
    `<div class="wrap" style="justify-content:center; align-items:center; text-align:center; gap:40px">
      <img src="file:///${logoDark}" style="width:520px"/>
      <h2 style="font-size:84px; margin-top:20px">Estimate Smarter.<br/>Build Better.</h2>
      <p class="lede muted" style="max-width:760px">Electrical estimates for Ghana, with the prices your team actually uses.</p>
      <div style="margin-top:30px; background:${brand.amber}; color:${brand.navy}; font-weight:800; font-size:34px; padding:28px 46px; border-radius:22px">Start an estimate</div>
    </div>`,
  ),
});

for (const scene of scenes) {
  fs.writeFileSync(path.join(scenesDir, "build", `${scene.name}.html`), scene.html, "utf8");
}

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
for (const scene of scenes) {
  const html = path.join(scenesDir, "build", `${scene.name}.html`);
  const png = path.join(out, `${scene.name}.png`);
  const result = spawnSync(
    chrome,
    ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--force-device-scale-factor=1", "--window-size=1080,1920", `--screenshot=${png}`, `file:///${html.replace(/\\/g, "/")}`],
    { stdio: "ignore" },
  );
  console.log(scene.name, result.status === 0 && fs.existsSync(png) ? "rendered" : "failed");
}
