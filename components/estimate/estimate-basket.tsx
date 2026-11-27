"use client";
import { useCurrency } from "@/components/currency/currency-provider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatGhs, materialUnitLabel } from "@/lib/format";
import { BASKET_EVENT, readBasket, writeBasket } from "@/lib/storage/basket";
import { saveEstimate } from "@/lib/storage/saved-estimates";
import type { BasketItem } from "@/lib/types";

interface Group {
  id: string;
  name: string;
  items: BasketItem[];
}

/** Lines without a group are the ones added straight from the catalogue. */
const DEFAULT_GROUP: Group = { id: "manual", name: "Catalogue picks", items: [] };

function groupItems(items: BasketItem[]): Group[] {
  const groups = new Map<string, Group>();
  for (const item of items) {
    const id = item.groupId ?? DEFAULT_GROUP.id;
    const name = item.groupName ?? DEFAULT_GROUP.name;
    const existing = groups.get(id);
    if (existing) existing.items.push(item);
    else groups.set(id, { id, name, items: [item] });
  }
  return Array.from(groups.values());
}

export function EstimateBasket() {
  // subscribe to the display currency so a change re-renders this view's prices
  useCurrency();
  const router = useRouter();
  const [items, setItems] = useState<BasketItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(readBasket());
      setReady(true);
    };
    sync();
    window.addEventListener(BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const groups = useMemo(() => groupItems(items), [items]);
  const totalUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const pricedSubtotal = useMemo(
    () => items.reduce((sum, item) => (item.priceGhs == null ? sum : sum + item.priceGhs * item.quantity), 0),
    [items],
  );
  const pendingCount = items.filter((item) => item.priceGhs == null).length;

  const persist = (next: BasketItem[]) => {
    setItems(next);
    writeBasket(next);
  };

  const changeQuantity = (groupId: string, materialId: string, quantity: number) => {
    const key = (item: BasketItem) => `${item.groupId ?? DEFAULT_GROUP.id}:${item.materialId}`;
    const target = `${groupId}:${materialId}`;
    if (quantity <= 0) {
      persist(items.filter((item) => key(item) !== target));
      return;
    }
    persist(items.map((item) => (key(item) === target ? { ...item, quantity } : item)));
  };

  const removeGroup = (groupId: string) => {
    persist(items.filter((item) => (item.groupId ?? DEFAULT_GROUP.id) !== groupId));
  };

  const saveGroup = (group: Group) => {
    const priced = group.items.reduce((sum, item) => (item.priceGhs == null ? sum : sum + item.priceGhs * item.quantity), 0);
    const units = group.items.reduce((sum, item) => sum + item.quantity, 0);
    const saved = saveEstimate({
      name: group.name,
      kind: "materials",
      detail: `${group.items.length} material${group.items.length === 1 ? "" : "s"} · ${units} units`,
      totalGhs: priced > 0 ? priced : null,
      items: group.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        priceGhs: item.priceGhs,
      })),
    });
    persist(items.filter((item) => (item.groupId ?? DEFAULT_GROUP.id) !== group.id));
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
          {groups.map((group) => {
            const groupTotal = group.items.reduce((sum, item) => (item.priceGhs == null ? sum : sum + item.priceGhs * item.quantity), 0);
            return (
              <section className="basket-group" key={group.id}>
                <header className="basket-group-head">
                  <div>
                    <h2>{group.name}</h2>
                    <span>
                      {group.items.length} material{group.items.length === 1 ? "" : "s"}
                      {groupTotal > 0 ? ` · ${formatGhs(groupTotal)}` : ""}
                    </span>
                  </div>
                  <div className="basket-group-actions">
                    <button className="btn btn-sm" type="button" onClick={() => saveGroup(group)}>Save this estimate</button>
                    <button className="btn btn-sm btn-ghost" type="button" onClick={() => removeGroup(group.id)}>Clear</button>
                  </div>
                </header>

                {group.items.map((item) => (
                  <article className="estimate-basket-item" key={`${group.id}:${item.materialId}`}>
                    <div className="estimate-basket-item-main">
                      <span className="eyebrow">{item.category}</span>
                      <h2>{item.name}</h2>
                      <p>{item.brandName || "Brand to be selected"}{item.supplierName ? ` · ${item.supplierName}` : ""}</p>
                      {item.priceGhs == null
                        ? <strong className="price-pending-inline">Price pending verification</strong>
                        : <strong>{formatGhs(item.priceGhs)} <small>{materialUnitLabel(item.unit || "unit")}</small></strong>}
                    </div>
                    <div className="estimate-qty" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" onClick={() => changeQuantity(group.id, item.materialId, item.quantity - 1)} aria-label="Reduce quantity">−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => changeQuantity(group.id, item.materialId, item.quantity + 1)} aria-label="Increase quantity">+</button>
                    </div>
                    <div className="estimate-line-total">
                      {item.priceGhs == null ? <span>Pending</span> : <strong>{formatGhs(item.priceGhs * item.quantity)}</strong>}
                      <button type="button" onClick={() => changeQuantity(group.id, item.materialId, 0)}>Remove</button>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
          <Link className="estimate-add-more" href="/catalogue">+ Add another material</Link>
        </section>

        <aside className="estimate-basket-totals">
          <div className="eyebrow">ALL ESTIMATES</div>
          <strong>{formatGhs(pricedSubtotal)}</strong>
          <p>
            {pendingCount
              ? `${pendingCount} material${pendingCount === 1 ? " has" : "s have"} no verified price yet and ${pendingCount === 1 ? "is" : "are"} excluded from this subtotal.`
              : "All selected materials have a verified base-unit price."}
          </p>
          <div className="estimate-total-row"><span>Estimates</span><b>{groups.length}</b></div>
          <div className="estimate-total-row"><span>Materials</span><b>{items.length}</b></div>
          <div className="estimate-total-row"><span>Total quantity</span><b>{totalUnits}</b></div>
          <div className="estimate-total-row"><span>Price pending</span><b>{pendingCount}</b></div>
          <small className="basket-saved-note">Each estimate is saved on its own, so they never mix.</small>
        </aside>
      </div>
    </>
  );
}
