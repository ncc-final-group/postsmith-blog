import { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    domains: ['localhost', 'images.unsplash.com'],
  },
  env: {
    NEXT_PUBLIC_API_SERVER: process.env.NEXT_PUBLIC_API_SERVER,
  },
};

export default config;
