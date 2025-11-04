/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-project.supabase.co'],
  },
  // Netlify deployment optimization
  output: 'standalone',
}

module.exports = nextConfig
