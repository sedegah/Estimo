import { CatalogueView } from "@/components/catalogue/catalogue-view";

type SearchParams = Promise<{ q?: string; cat?: string }>;

/** Catalogue inside the app shell (sidebar stays visible). */
export default async function DashboardCataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", cat = "all" } = await searchParams;

  return (
    <>
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Material prices</p>
          <h1 className="app-title">Catalogue</h1>
        </div>
      </header>
      <CatalogueView q={q} cat={cat} showHeader={false} />
    </>
  );
}
