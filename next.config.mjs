/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // 엑셀 업로드 고려
    },
  },
};

export default nextConfig;
