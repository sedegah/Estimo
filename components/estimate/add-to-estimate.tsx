"use client";

import { useEffect, useState } from "react";
import { BASKET_EVENT, readBasket, writeBasket } from "@/lib/storage/basket";
import type { BasketItem } from "@/lib/types";

type Props = {
  item: Omit<BasketItem, "quantity">;
  variant?: "primary" | "outline";
  label?: string;
};

export function AddToEstimateButton({ item, variant = "primary", label = "+ Add to estimate" }: Props) {
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

  const add = () => {
    const current = readBasket();
    const existing = current.find((entry) => entry.materialId === item.materialId);
    if (existing) {
      writeBasket(current.map((entry) => entry.materialId === item.materialId
        ? { ...entry, quantity: entry.quantity + 1 }
        : entry));
    } else {
      writeBasket([...current, { ...item, quantity: 1 }]);
    }
    setAdded(true);
  };

  const className = variant === "outline" ? "btn-outline btn-sm" : `btn ${added ? "btn-added" : "btn-primary"}`;

  return (
    <button className={className} type="button" onClick={add}>
      {variant === "outline" ? (added ? "Added" : label) : (added ? "Add another" : label)}
    </button>
  );
}
