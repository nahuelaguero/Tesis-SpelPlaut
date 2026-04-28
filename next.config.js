/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: "tsconfig.next.json",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: [
    "@aws-sdk/client-s3",
    "bcryptjs",
    "jsonwebtoken",
    "mongodb",
    "mongoose",
    "nodemailer",
    "web-push",
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.node_modules_old/**",
          "**/.next/**",
          "**/.next_backup_*/**",
          "**/.venv-docx/**",
          "**/docs/**",
          "**/mockups-temp/**",
          "**/scripts/stress-tests/**",
        ],
      };
    }

    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
    resolveAlias: {
      "@": "./src",
    },
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
