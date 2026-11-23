import path from "node:path";
import type { NextConfig } from "next";

/** The admin console is bundled as a standalone server inside the desktop app. */
const nextConfig: NextConfig = {
  // Stamped at build time so a stale console is obvious in the rail.
  env: { NEXT_PUBLIC_CONSOLE_BUILD: new Date().toISOString().slice(0, 16).replace("T", " ") },

  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  // The PDF route reads the brand fonts and wordmarks from /public at runtime.
  outputFileTracingIncludes: {
    "/api/estimate-pdf": ["./public/fonts/**", "./public/brand/**"],
  },
};

export default nextConfig;
