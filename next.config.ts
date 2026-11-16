import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // The PDF route reads the system typeface from /public at runtime.
  outputFileTracingIncludes: {
    "/api/estimates/pdf": ["./public/fonts/**"],
  },
  async redirects() {
    return [
      { source: "/sign-in", destination: "/signin", permanent: true },
      { source: "/sign-up", destination: "/signup", permanent: true },
      { source: "/catalog", destination: "/catalogue", permanent: true },
      { source: "/saved", destination: "/projects", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
