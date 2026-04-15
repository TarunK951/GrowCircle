import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        pathname: "/**",
      },
      /** Host-uploaded meet images (S3 / compatible object storage) */
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
        pathname: "/**",
      },
      /** Railway app / static file hosts */
      {
        protocol: "https",
        hostname: "**.up.railway.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.railway.app",
        pathname: "/**",
      },
      /** Cloudflare R2 public buckets */
      {
        protocol: "https",
        hostname: "**.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      /** Supabase Storage */
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      /** Google Cloud Storage */
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.storage.googleapis.com",
        pathname: "/**",
      },
      /** Azure Blob */
      {
        protocol: "https",
        hostname: "**.blob.core.windows.net",
        pathname: "/**",
      },
      /** DigitalOcean Spaces (S3-compatible) */
      {
        protocol: "https",
        hostname: "**.digitaloceanspaces.com",
        pathname: "/**",
      },
      /** Local dev: MinIO or backend-served files (http://localhost:PORT/...) */
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
