/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pg 모듈을 서버 번들에 포함시키기
      config.externals = [...config.externals.filter(pkg => pkg !== 'pg')];
    }
    return config;
  },
};

module.exports = nextConfig; 