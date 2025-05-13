// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/voter/:path*', // Clean URL
        destination: '/main/voter/:path*', // Actual file path
      },
      {
        source: '/register/:path*', // Clean URL
        has: [{ type: 'query', key: 'role', value: 'voter' }],
        destination: '/main/voter/registerPage:path*', // Actual file path
      },
      {
        source: '/admin/:path*',
        destination: '/main/electionAdmin/:path*',
      },
      {
        source: '/register/:path*',
        has: [{ type: 'query', key: 'role', value: 'admin' }],
        destination: '/main/electionAdmin/registerPage:path*',
      },
      {
        source: '/register',
        destination: '/main/voter/registerPage',
      },
      {
        source: '/VotreXAdminPanel/:path*',
        destination: '/votreXTokenAdmin:path*',
      },
      {
        source: '/login',
        destination: '/main/loginPage',
      },
      {
        source: '/dashboard/:path*', 
        has: [{ type: 'query', key: 'role', value: 'voter' }],
        destination: '/main/voter/dashboard:path*',
      },
      {
        source: '/dashboard/:path*',
        has: [{ type: 'query', key: 'role', value: 'admin' }],
        destination: '/main/electionAdmin/dashboard:path*',
      },
      {
        source: '/dashboard/manageElection:path*',
        destination: '/main/electionAdmin/dashboard/electionManager:path*',
      },
    ];
  },
};

module.exports = nextConfig;
