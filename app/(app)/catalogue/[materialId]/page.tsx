import Link from "next/link";
import { notFound } from "next/navigation";
import { materialById } from "@/lib/data/catalogue";
import { AddToEstimateButton } from "@/components/estimate/add-to-estimate";


export default async function MaterialPage({ params }: { params: Promise<{ materialId: string }> }) {
  const { materialId } = await params;
  const material = materialById(materialId);
  if (!material) notFound();

  return (
    <>
      <div className="product-intelligence-page">
      <div className="breadcrumb">
        <Link href="/catalogue">Catalogue</Link>
        <span>â€º</span>
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
          <strong>Material facts, not guesses</strong>
          <p>
            This build ships the material library locally. Supplier prices stay visibly missing until a verified price
            source is connected â€” ESTIMO never presents an unverified figure as a trusted price.
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
                <td>{material.spec || "â€”"}</td>
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
                <td>{material.keywords.length ? material.keywords.join(", ") : "â€”"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card config-section">
        <h2>Verified current prices</h2>
        <p>
          No supplier price feed is connected in this build, so no comparable prices are shown. The material can still
          be added to your estimate and carries its unit and specification.
        </p>
        <div className="material-result-actions">
          <AddToEstimateButton
            item={{
              materialId: material.id,
              name: material.name,
              category: material.category,
              unit: material.unit,
              priceGhs: null,
              brandName: null,
              supplierName: null,
              verifiedAt: null,
            }}
          />
          <Link className="btn btn-secondary" href="/estimate-basket">Open my estimate</Link>
        </div>
      </section>
      </div>
    </>
  );
}


