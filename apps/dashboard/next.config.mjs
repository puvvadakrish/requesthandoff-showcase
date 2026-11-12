/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages need transpilation since they ship as TS sources at MVP.
  transpilePackages: [
    "@requesthandoff/schema",
    "@requesthandoff/supabase-client-rls",
    "@requesthandoff/supabase-client-service",
  ],
};

export default nextConfig;
