import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev-tools indicator out of the sidebar's corner — bottom-left
  // collides with the sidebar footer content.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
