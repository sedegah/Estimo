import type { MetadataRoute } from "next";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import { siteUrl } from "@/lib/site-url";

const baseUrl = siteUrl();

/** Every public page, plus a page for each catalogue material. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/catalogue`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/quick-estimate`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/estimate`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/signin`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/signup`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];

  const materials: MetadataRoute.Sitemap = CATALOGUE_MATERIALS.map((material) => ({
    url: `${baseUrl}/catalogue/${material.id}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...pages, ...materials];
}
