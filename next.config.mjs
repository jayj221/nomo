import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @vladmandic/human ships a Node build that pulls in tfjs-node;
    // force the browser ESM build (face-presence check runs client-side).
    config.resolve.alias = {
      ...config.resolve.alias,
      "@vladmandic/human": path.resolve(
        process.cwd(),
        "node_modules/@vladmandic/human/dist/human.esm.js",
      ),
    };
    return config;
  },
};

export default nextConfig;
