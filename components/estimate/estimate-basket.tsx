"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatGhs, materialUnitLabel } from "@/lib/format";
import { BASKET_EVENT, readBasket, writeBasket } from "@/lib/storage/basket";
import { saveEstimate } from "@/lib/storage/saved-estimates";
import type { BasketItem } from "@/lib/types";

export function EstimateBasket() {
  const router = useRouter();
  const [items, setItems] = useState<BasketItem[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("My material estimate");

  useEffect(() => {
    setItems(readBasket());
    setReady(true);
  }, []);

  const persist = (next: BasketItem[]) => {
    setItems(next);
    writeBasket(next);
  };

  const changeQuantity = (materialId: string, quantity: number) => {
    if (quantity <= 0) {
      persist(items.filter((item) => item.materialId !== materialId));
      return;
    }
    persist(items.map((item) => item.materialId === materialId ? { ...item, quantity } : item));
  };

  const totalUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const pricedSubtotal = useMemo(
    () => items.reduce((sum, item) => (item.priceGhs == null ? sum : sum + item.priceGhs * item.quantity), 0),
    [items],
  );
  const pendingCount = items.filter((item) => item.priceGhs == null).length;

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim() || "My material estimate";
    const saved = saveEstimate({
      name: trimmed,
      kind: "materials",
      detail: `${items.length} material${items.length === 1 ? "" : "s"} · ${totalUnits} units`,
      totalGhs: pricedSubtotal > 0 ? pricedSubtotal : null,
      items: items.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit, priceGhs: item.priceGhs })),
    });
    // the list is saved, so take the person to it rather than leaving them on the basket
    writeBasket([]);
    router.push(`/projects/${saved.id}`);
  };

  if (!ready) return <div className="notice">Loading your estimate…</div>;

  if (!items.length) {
    return (
      <section className="estimate-basket-empty">
        <div className="eyebrow">YOUR ESTIMATE</div>
        <h1>Nothing added yet.</h1>
        <p>Search the catalogue, choose the materials you need, and add them here.</p>
        <Link className="btn btn-primary" href="/catalogue">Find materials</Link>
      </section>
    );
  }

  return (
    <>
      <section className="estimate-basket-hero">
        <div>
          <div className="eyebrow">YOUR ESTIMATE</div>
          <h1>Build your material estimate.</h1>
          <p className="lead">Adjust quantities as you go. Every line keeps its unit and specification, even before a verified price is attached.</p>
        </div>
        <div className="estimate-basket-summary">
          <span>{items.length}<small>materials</small></span>
          <span>{totalUnits}<small>total units</small></span>
          <span>{pendingCount}<small>price pending</small></span>
        </div>
      </section>

      <div className="estimate-basket-layout">
        <section className="estimate-basket-list">
          {items.map((item) => (
            <article className="estimate-basket-item" key={item.materialId}>
              <div className="estimate-basket-item-main">
                <span className="eyebrow">{item.category}</span>
                <h2>{item.name}</h2>
                <p>{item.brandName || "Brand to be selected"}{item.supplierName ? ` · ${item.supplierName}` : ""}</p>
                {item.priceGhs == null
                  ? <strong className="price-pending-inline">Price pending verification</strong>
                  : <strong>{formatGhs(item.priceGhs)} <small>{materialUnitLabel(item.unit || "unit")}</small></strong>}
              </div>
              <div className="estimate-qty" aria-label={`Quantity for ${item.name}`}>
                <button type="button" onClick={() => changeQuantity(item.materialId, item.quantity - 1)} aria-label="Reduce quantity">−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => changeQuantity(item.materialId, item.quantity + 1)} aria-label="Increase quantity">+</button>
              </div>
              <div className="estimate-line-total">
                {item.priceGhs == null ? <span>Pending</span> : <strong>{formatGhs(item.priceGhs * item.quantity)}</strong>}
                <button type="button" onClick={() => changeQuantity(item.materialId, 0)}>Remove</button>
              </div>
            </article>
          ))}
          <Link className="estimate-add-more" href="/catalogue">+ Add another material</Link>
        </section>

        <aside className="estimate-basket-totals">
          <div className="eyebrow">BASE-UNIT SUBTOTAL</div>
          <strong>{formatGhs(pricedSubtotal)}</strong>
          <p>
            {pendingCount
              ? `${pendingCount} material${pendingCount === 1 ? " has" : "s have"} no verified price yet and ${pendingCount === 1 ? "is" : "are"} excluded from this subtotal.`
              : "All selected materials have a verified base-unit price."}
          </p>
          <div className="estimate-total-row"><span>Materials</span><b>{items.length}</b></div>
          <div className="estimate-total-row"><span>Total quantity</span><b>{totalUnits}</b></div>
          <div className="estimate-total-row"><span>Price pending</span><b>{pendingCount}</b></div>

          <form className="basket-save-form" onSubmit={save}>
            <label>Save as<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <button className="btn btn-primary" type="submit">Save estimate →</button>
          </form>
          <small className="basket-saved-note">Saved locally in this browser.</small>
        </aside>
      </div>
    </>
  );
}
