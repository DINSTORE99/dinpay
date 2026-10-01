/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.buatqris.site",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
