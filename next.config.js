/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'images.unsplash.com',
      // 필요한 외부 이미지 도메인을 여기에 추가
    ],
  },
};

module.exports = nextConfig;
