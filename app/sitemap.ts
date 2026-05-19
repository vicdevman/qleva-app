import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://qleva.app";
  const routes = [
    "",
    "/dashboard",
    "/portfolio",
    "/wallets",
    "/automations",
    "/activity",
    "/settings",
    "/chat",
    "/notifications",
    "/help",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
