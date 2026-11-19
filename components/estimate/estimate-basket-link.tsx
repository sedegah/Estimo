"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BASKET_EVENT, basketMaterialCount, readBasket } from "@/lib/storage/basket";

export function EstimateBasketLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(basketMaterialCount(readBasket()));
    sync();
    window.addEventListener(BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link
      className="estimate-basket-link"
      href="/estimate-basket"
      aria-label={`Estimate basket: ${count} material${count === 1 ? "" : "s"}`}
    >
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M3 4h2.2l1.5 9.3a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 2-1.6L20 7H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </svg>
      <span className="estimate-basket-count">{count}</span>
    </Link>
  );
}
