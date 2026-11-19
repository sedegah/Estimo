import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToEstimateButton } from "@/components/estimate/add-to-estimate";
import { materialById } from "@/lib/data/catalogue";
import { getCataloguePrices } from "@/lib/api/catalogue-prices";
import { formatPrice, materialUnitLabel } from "@/lib/format";

export default async function MaterialPage({ params }: { params: Promise<{ materialId: string }> }) {
  const { materialId } = await params;
  const material = materialById(materialId);
  if (!material) notFound();

  const price = (await getCataloguePrices())[material.id];

  return (
    <main className="container page-shell product-intelligence-page">
      <div className="breadcrumb">
        <Link href="/catalogue">Catalogue</Link>
        <span>›</span>
        <span>{material.name}</span>
      </div>

      <section className="product-intel-hero">
        <div>
          <span className="eyebrow">ESTIMO Material Library</span>
          <h1>{material.name}</h1>
          <p>{material.purpose || "Purpose not yet documented."}</p>
          <div className="product-meta">
            <span>{material.code}</span>
            <span>{material.category}</span>
            <span>Base unit {material.unit}</span>
          </div>
        </div>
        <div className="intelligence-guard">
          <strong>{price ? formatPrice(price.price, material.unit) : "No price yet"}</strong>
          <p>
            {price
              ? `Please note that this is the ${price.source ?? "published"} list price${price.brand ? ` for ${price.brand}` : ""}, not a quotation. Prices change without notice.`
              : "No verified price is published for this material yet. ESTIMO never presents an unverified figure as a trusted price."}
          </p>
        </div>
      </section>

      <section className="card config-section">
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
                <td>{material.relevance || "Not set"}</td>
              </tr>
              <tr>
                <th>Search keywords</th>
                <td>{material.keywords.length ? material.keywords.join(", ") : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card config-section">
        <h2>Current price</h2>
        {price ? (
          <>
            <p className="material-price">{formatPrice(price.price, material.unit)}</p>
            <p className="settings-note">
              {price.brand ? `${price.brand} · ` : ""}
              {price.source ?? "published price"}
              {price.updatedAt ? ` · recorded ${price.updatedAt.slice(0, 10)}` : ""} · {materialUnitLabel(material.unit)}
            </p>
          </>
        ) : (
          <p className="settings-note">
            No price is published for this material yet, so it is added to the estimate without one. The unit and
            specification still travel with it.
          </p>
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
