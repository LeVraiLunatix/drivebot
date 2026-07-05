import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les packages workspace (@drivebot/*) sont en TS brut : Next doit les transpiler.
  transpilePackages: ["@drivebot/database", "@drivebot/types"],
  images: {
    // Avatars de serveurs Discord.
    remotePatterns: [{ protocol: "https", hostname: "cdn.discordapp.com" }],
  },
};

export default nextConfig;
