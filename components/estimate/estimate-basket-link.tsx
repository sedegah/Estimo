"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BASKET_EVENT, basketUnitCount, readBasket } from "@/lib/storage/basket";

export function EstimateBasketLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(basketUnitCount(readBasket()));
    sync();
    window.addEventListener(BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return <Link className="estimate-basket-link" href="/estimate-basket">Estimate <span>{count}</span></Link>;
}
