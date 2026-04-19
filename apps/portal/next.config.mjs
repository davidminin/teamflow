/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_N8N_EDITOR_URL: process.env.N8N_EDITOR_URL || "http://localhost:5678",
    NEXT_PUBLIC_LANGFUSE_URL: process.env.LANGFUSE_URL || "http://localhost:3000",
  },
  // Allow Vercel image optimization in preview deployments
  images: {
    unoptimized: process.env.VERCEL ? false : true,
  },
};

export default nextConfig;
