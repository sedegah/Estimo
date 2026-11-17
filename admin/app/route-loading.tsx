"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "./loading-screen";

/** Brief branded cover on every route change, including entering and leaving the builder. */
export function RouteLoading() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 450);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="route-loading">
      <LoadingScreen />
    </div>
  );
}
