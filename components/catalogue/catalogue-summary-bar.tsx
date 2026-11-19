"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BASKET_EVENT, readBasket } from "@/lib/storage/basket";

/** Sticky summary of the estimate basket, shown only when something is in it. */
export function CatalogueSummaryBar() {
  const [state, setState] = useState({ count: 0, total: 0, pending: 0 });

  useEffect(() => {
    const sync = () => {
      const basket = readBasket();
      let total = 0;
      let pending = 0;
      for (const entry of basket) {
        if (typeof entry.priceGhs === "number") total += entry.priceGhs * entry.quantity;
        else pending += 1;
      }
      setState({ count: basket.reduce((sum, entry) => sum + entry.quantity, 0), total, pending });
    };
    sync();
    window.addEventListener(BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!state.count) return null;

  return (
    <div className="catalogue-summary">
      <div className="catalogue-summary-copy">
        <span>{state.count === 1 ? "1 item in your estimate" : `${state.count} items in your estimate`}</span>
        <div>
          <strong>GHS {state.total.toLocaleString("en-GH", { maximumFractionDigits: 2 })}</strong>
          <small>{state.pending > 0 ? `+ ${state.pending} awaiting price` : "Based on current prices"}</small>
        </div>
      </div>
      <Link className="catalogue-summary-cta" href="/estimate-basket">Review estimate</Link>
    </div>
  );
}
