import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    qualities: [75, 88],
  },
};

export default nextConfig;
