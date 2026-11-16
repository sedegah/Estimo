import { CatalogueView } from "@/components/catalogue/catalogue-view";

type SearchParams = Promise<{ q?: string; cat?: string }>;

/** Public catalogue: standalone page with the site header. */
export default async function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", cat = "all" } = await searchParams;

  return (
    <main className="container page-shell">
      <p className="app-eyebrow">Material prices</p>
      <h1 className="page-title">Check material prices</h1>
      <p className="page-sub">Search the catalogue to see current prices before you start an estimate.</p>
      <CatalogueView q={q} cat={cat} />
    </main>
  );
}
