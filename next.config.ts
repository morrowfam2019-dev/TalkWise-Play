import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Legacy routes from before TalkWise Play became a multi-game platform.
   *
   * The adventure used to live at the root (`/play/m-adventure`, `/shop`),
   * which means real bookmarks — and the deployed Whop experience itself —
   * point there. These keep every one of those links working instead of
   * 404-ing a paying family mid-practice. Permanent, because the new
   * `/games/...` paths are the real homes now.
   */
  async redirects() {
    return [
      {
        source: "/play/:levelId",
        destination: "/games/adventures/play/:levelId",
        permanent: true,
      },
      { source: "/shop", destination: "/games/adventures/shop", permanent: true },
      { source: "/basketball", destination: "/games/basketball", permanent: true },
      {
        source: "/basketball/:soundId",
        destination: "/games/basketball/play/:soundId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
