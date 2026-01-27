import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
    // Mark privacycash as external to prevent bundling issues with Node.js modules
    serverComponentsExternalPackages: ["privacycash", "node-localstorage"],
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/solana-labs/token-list/**",
      },
      {
        protocol: "https",
        hostname: "s2.coinmarketcap.com",
        pathname: "/static/img/coins/**",
      },
    ],
  },

  // Turbopack config for dev
  turbopack: {},

  // Webpack configuration for production build (Solana libraries)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Externalize privacycash for server-side to use actual Node.js modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "privacycash": "commonjs privacycash",
        "node-localstorage": "commonjs node-localstorage",
      });
    }
    
    return config;
  },
};

export default nextConfig;
