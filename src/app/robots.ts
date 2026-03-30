import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/retro/", "/estimation/", "/sign-in"],
      },
    ],
    sitemap: "https://ceremonies.dev/sitemap.xml",
  };
}
