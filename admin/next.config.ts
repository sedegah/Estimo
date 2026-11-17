import path from "node:path";
import type { NextConfig } from "next";

/** The admin console is bundled as a standalone server inside the desktop app. */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
};

export default nextConfig;
