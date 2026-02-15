/** @type {import('next').NextConfig} */
const nextConfig = {
    // Production-ready: TypeScript and ESLint errors will fail the build
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    // Adding transpilePackages to handle potential ESM issues in dependencies
    transpilePackages: ['lucide-react', 'recharts'],
    webpack: (config) => {
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        config.resolve.fallback = { fs: false, net: false, tls: false };
        return config;
    },
};

export default nextConfig;
