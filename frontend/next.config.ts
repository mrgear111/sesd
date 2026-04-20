import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Only type check files in the frontend directory
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
