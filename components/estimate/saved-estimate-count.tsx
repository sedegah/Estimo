"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SAVED_EVENT, listSavedEstimates } from "@/lib/storage/saved-estimates";

/** Badge that follows how many estimates/projects the signed-in user has. */
export function SavedEstimateCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(listSavedEstimates().length);
    sync();
    window.addEventListener(SAVED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SAVED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link className="estimate-basket-link" href="/estimates">
      Estimate <span>{count}</span>
    </Link>
  );
}
