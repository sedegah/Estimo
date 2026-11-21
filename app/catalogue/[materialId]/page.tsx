import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToEstimateButton } from "@/components/estimate/add-to-estimate";
import { materialById } from "@/lib/data/catalogue";
import { getCatalogueData, materialImageUrl } from "@/lib/api/catalogue-prices";
import { formatPrice } from "@/lib/format";

export default async function MaterialPage({ params }: { params: Promise<{ materialId: string }> }) {
  const { materialId } = await params;
  const material = materialById(materialId);
  if (!material) notFound();

  const catalogue = await getCatalogueData();
  const price = catalogue.prices[material.id];
  const imageUrl = materialImageUrl(catalogue.images[material.id]);
  const brand = price?.brand && price.brand !== price.source ? price.brand : null;

  return (
    <main className="container page-shell material-page">
      <div className="breadcrumb">
        <Link href="/catalogue">Catalogue</Link>
        <span aria-hidden="true">›</span>
        <span>{material.name}</span>
      </div>

      <section className="material-hero">
        <div className="material-hero-copy">
          <span className="eyebrow">ESTIMO Material Library</span>
          <h1>{material.name}</h1>
          <p className="material-purpose">{material.purpose || "Purpose not yet documented."}</p>
          <div className="product-meta">
            <span>{material.code}</span>
            <span>{material.category}</span>
            <span>Base unit {material.unit}</span>
          </div>
        </div>

        <figure className={imageUrl ? "material-photo has-image" : "material-photo"}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={`${material.name}${brand ? ` by ${brand}` : ""}`}
              width={640}
              height={480}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="3" y="4" width="18" height="14" rx="2.5" />
                <path d="m4.5 16 4.2-4.2a2 2 0 0 1 2.8 0l2.1 2.1M14 12.5l1.6-1.6a2 2 0 0 1 2.8 0L21 13.5" strokeLinecap="round" />
              </svg>
              <figcaption>
                <strong>Product photo</strong>
                <span>Not supplied yet</span>
              </figcaption>
            </>
          )}
        </figure>
      </section>

      <section className="card config-section spec-section">
        <h2>Specification</h2>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <th>Standard specification</th>
                <td>{material.spec || "-"}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>{material.category}</td>
              </tr>
              <tr>
                <th>Base unit</th>
                <td>{material.unit} ({material.unitCode})</td>
              </tr>
              <tr>
                <th>Quality tier</th>
                <td>{material.tier || "Not set"}</td>
              </tr>
              <tr>
                <th>Quick-build relevance</th>
                <td>
                  {material.relevance ? (
                    <span className={`spec-chip is-${material.relevance.toLowerCase()}`}>{material.relevance}</span>
                  ) : (
                    "Not set"
                  )}
                </td>
              </tr>
              <tr>
                <th>Search keywords</th>
                <td>
                  {material.keywords.length ? (
                    <span className="spec-chips">
                      {material.keywords.map((keyword) => (
                        <span className="spec-chip" key={keyword}>{keyword}</span>
                      ))}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card material-price-card">
        <span className="eyebrow">Current price</span>
        {price ? (
          <>
            <p className="material-price">{formatPrice(price.price, material.unit)}</p>
            <p className="material-price-meta">
              {brand ? `${brand} · ` : ""}
              {price.source ?? "published price"}
              {price.updatedAt ? ` · recorded ${price.updatedAt.slice(0, 10)}` : ""}
            </p>
            <p className="material-price-note">
              A list price from the supplier, not a quotation. It can change without notice.
            </p>
          </>
        ) : (
          <>
            <p className="material-price material-price-missing">No price yet</p>
            <p className="material-price-note">
              This material still goes into an estimate with its unit and specification; it simply carries no amount
              until a price is published.
            </p>
          </>
        )}

        <div className="material-result-actions">
          <AddToEstimateButton
            item={{
              materialId: material.id,
              name: material.name,
              category: material.category,
              unit: material.unit,
              priceGhs: price?.price ?? null,
              brandName: price?.brand ?? null,
              supplierName: price?.source ?? null,
              verifiedAt: price?.updatedAt ?? null,
            }}
          />
          <Link className="btn btn-secondary" href="/estimate-basket">Open my estimate</Link>
        </div>
      </section>
    </main>
  );
}
