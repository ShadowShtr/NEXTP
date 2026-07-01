/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O código Android arquivado não faz parte do build web.
  outputFileTracingExcludes: {
    "*": ["./android/**"],
  },
};

export default nextConfig;
