import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // serverComponentsExternalPackages 대신 serverExternalPackages 사용
  },
  serverExternalPackages: ['sequelize', 'sqlite3'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
