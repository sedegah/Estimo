"use client";

import { useEffect, useState } from "react";
import { BASKET_EVENT, readBasket, writeBasket } from "@/lib/storage/basket";
import type { BasketItem } from "@/lib/types";

type Props = { item: Omit<BasketItem, "quantity"> };

/** Add button that becomes a − / qty / + stepper once the material is in the estimate. */
export function CatalogueQuantityControl({ item }: Props) {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const sync = () => setQuantity(readBasket().find((entry) => entry.materialId === item.materialId)?.quantity ?? 0);
    sync();
    window.addEventListener(BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [item.materialId]);

  const setTo = (next: number) => {
    const current = readBasket();
    const without = current.filter((entry) => entry.materialId !== item.materialId);
    writeBasket(next > 0 ? [...without, { ...item, quantity: next }] : without);
    setQuantity(Math.max(0, next));
  };

  if (quantity === 0) {
    return (
      <button
        className="catalogue-add"
        type="button"
        onClick={() => setTo(1)}
        aria-label={`Add ${item.name} to estimate`}
      >
        Add
      </button>
    );
  }

  return (
    <div className="catalogue-stepper">
      <button type="button" onClick={() => setTo(quantity - 1)} aria-label={`Decrease quantity of ${item.name}`}>−</button>
      <span aria-live="polite">{quantity}</span>
      <button type="button" onClick={() => setTo(quantity + 1)} aria-label={`Increase quantity of ${item.name}`}>+</button>
    </div>
  );
}
