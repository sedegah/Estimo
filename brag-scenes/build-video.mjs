// Assembles the portrait launch video from the rendered scenes, with slow push-in
// motion, crossfades and the bundled music bed.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const out = path.join(root, "brag-output");
const ffmpeg = path.join(root, "tools", "ffmpeg", "ffmpeg.exe");
const music = "C:\\\\Users\\\\kimat\\\\.agents\\\\skills\\\\brag\\\\assets\\\\music\\\\happy-beats-business-moves-vol-1-by-ende-dot-app.mp3";

const scenes = [1, 2, 3, 4, 5, 6].map((n) => path.join(out, `scene-${n}.png`));
for (const scene of scenes) {
  if (!fs.existsSync(scene)) throw new Error(`missing ${scene}`);
}

const inputArgs = [];
scenes.forEach((scene) => inputArgs.push("-i", scene));
inputArgs.push("-i", music);

const filters = [];
scenes.forEach((_, index) => {
  filters.push(
    `[${index}:v]scale=1240:2204:force_original_aspect_ratio=increase,crop=1240:2204,zoompan=z='min(zoom+0.00045,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1080x1920:fps=30,format=yuv420p[v${index}]`,
  );
});

let previous = "v0";
for (let index = 1; index < scenes.length; index += 1) {
  const offset = index * 2.4;
  const label = index === scenes.length - 1 ? "vout" : `x${index}`;
  filters.push(`[${previous}][v${index}]xfade=transition=fade:duration=0.6:offset=${offset.toFixed(2)}[${label}]`);
  previous = label;
}

const musicIndex = scenes.length;
filters.push(`[${musicIndex}:a]atrim=0:14.8,asetpts=N/SR/TB,afade=t=in:st=0:d=0.6,afade=t=out:st=12.9:d=1.9,volume=0.85[aout]`);

const output = path.join(out, "brag.mp4");
const args = [
  "-y",
  ...inputArgs,
  "-filter_complex", filters.join(";"),
  "-map", "[vout]",
  "-map", "[aout]",
  "-t", "15",
  "-r", "30",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "20",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "160k",
  "-movflags", "+faststart",
  output,
];

console.log("rendering…");
const result = spawnSync(ffmpeg, args, { stdio: ["ignore", "inherit", "inherit"] });
if (result.status !== 0) process.exit(result.status ?? 1);

const poster = path.join(out, "brag.jpg");
const posterResult = spawnSync(ffmpeg, ["-y", "-i", output, "-vf", "select=eq(n\\,12)", "-frames:v", "1", "-q:v", "2", poster], {
  stdio: ["ignore", "ignore", "inherit"],
});
console.log(posterResult.status === 0 ? `video: ${output}\nposter: ${poster}` : "poster failed");
