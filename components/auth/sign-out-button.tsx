"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearLocalData } from "@/lib/storage/reset";

/** Clerk is the only session: signing out clears it and returns home. */
export function SignOutButton({ className = "app-rail-signout" }: { className?: string }) {
  const clerk = useClerk();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className={className}
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await clerk.signOut();
        } finally {
          clearLocalData();
          router.push("/");
          router.refresh();
        }
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
