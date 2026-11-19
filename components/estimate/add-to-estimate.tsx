"use client";

import { useEffect, useState } from "react";
import { BASKET_EVENT, readBasket, writeBasket } from "@/lib/storage/basket";
import type { BasketItem } from "@/lib/types";

type Props = {
  item: Omit<BasketItem, "quantity">;
  variant?: "primary" | "outline";
  label?: string;
  removeLabel?: string;
};

/** Adds the material to the estimate basket, then turns into the way back out. */
export function AddToEstimateButton({ item, variant = "primary", label = "+ Add to estimate", removeLabel }: Props) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const sync = () => setAdded(readBasket().some((entry) => entry.materialId === item.materialId));
    sync();
    window.addEventListener(BASKET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BASKET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [item.materialId]);

  const toggle = () => {
    const current = readBasket();
    const exists = current.some((entry) => entry.materialId === item.materialId);
    if (exists) {
      writeBasket(current.filter((entry) => entry.materialId !== item.materialId));
      setAdded(false);
      return;
    }
    writeBasket([...current, { ...item, quantity: 1 }]);
    setAdded(true);
  };

  const removed = removeLabel ?? (variant === "outline" ? "Remove" : "Remove from estimate");
  const className = variant === "outline"
    ? `btn-outline btn-sm${added ? " is-added" : ""}`
    : `btn ${added ? "btn-added" : "btn-primary"}`;

  return (
    <button className={className} type="button" onClick={toggle} aria-pressed={added}>
      {added ? removed : label}
    </button>
  );
}
