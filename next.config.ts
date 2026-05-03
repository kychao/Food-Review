import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // allow image uploads up to 5MB
    },
  },
};

export default nextConfig;
