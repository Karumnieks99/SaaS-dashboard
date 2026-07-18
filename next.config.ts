import type { NextConfig } from "next";

// basePath only applies in the GitHub Actions build (GITHUB_ACTIONS is set
// automatically by the Actions runner) so `npm run dev` keeps working at
// the plain root, unchanged.
const isGithubActionsBuild = process.env.GITHUB_ACTIONS === "true";
const repoBasePath = "/SaaS-dashboard";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubActionsBuild ? repoBasePath : "",
  assetPrefix: isGithubActionsBuild ? repoBasePath : "",
  // Emit `/me/index.html` instead of `/me.html` so GitHub Pages' plain static
  // file server (not Jekyll) can resolve extensionless routes like `/overview`.
  trailingSlash: true,
  // Keep the dev-tools indicator out of the sidebar's corner — bottom-left
  // collides with the sidebar footer content.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
