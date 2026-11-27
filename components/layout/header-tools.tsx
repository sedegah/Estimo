"use client";

import { useEffect, useState } from "react";
import { EstimateBasketLink } from "@/components/estimate/estimate-basket-link";
import { CurrencySelect } from "@/components/currency/currency-select";
import { BASKET_EVENT, basketMaterialCount, readBasket } from "@/lib/storage/basket";

/**
 * The end of the header: the currency picker normally, the basket once a material has
 * been added from the catalogue. The two never appear together — the cart takes the
 * picker's place while it has something in it.
 */
export function HeaderTools() {
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

  return count > 0 ? <EstimateBasketLink /> : <CurrencySelect />;
}
