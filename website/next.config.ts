import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "multi-vendor-1mzl.vercel.app",
          },
        ],
        destination: "https://tradepointmw.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
