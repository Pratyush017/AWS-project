import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["onnxruntime-node", "sharp", "sharp-phash"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "ugqvtsnayytwenhnwmgj.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cpcmkcjddqpkhjhvugto.supabase.co", // Keeping old one just in case
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
