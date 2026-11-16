import Link from "next/link";
import { AddToEstimateButton } from "@/components/estimate/add-to-estimate";
import type { CatalogueMaterial } from "@/lib/types";

export function MaterialCard({ material }: { material: CatalogueMaterial }) {
  return (
    <article className="material-result-card">
      <div className="material-result-topline">
        <span>{material.category}</span>
        {material.relevance ? <em>{material.relevance} relevance</em> : null}
      </div>
      <h3>{material.name}</h3>
      <p className="material-result-purpose">{material.purpose || "Electrical installation material."}</p>

      <div className="material-price-pending">
        <strong>Price pending verification</strong>
        <span>This offline catalogue keeps verified supplier prices separate from the material library.</span>
      </div>

      <div className="material-result-meta">
        <span>Size/rating: <strong>{material.spec || "See details"}</strong></span>
        <span>Unit: <strong>{material.unit}</strong></span>
        <span>Code: <strong>{material.code}</strong></span>
      </div>

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
        <Link className="btn btn-secondary" href={`/catalogue/${material.id}`}>
          View details
        </Link>
      </div>
    </article>
  );
}
