import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Everything runs in the browser, so ship plain static files that any host can serve
  // (Vercel, or China-friendly static hosting such as Tencent CloudBase / Alibaba OSS).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
