"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clerkEnabled } from "@/lib/env";
import { clearLocalData } from "@/lib/storage/reset";

/**
 * Clerk is the only session: signing out clears it and returns home.
 * Without Clerk keys there is no session to end, so the button renders nothing at all.
 */
export function SignOutButton({ className = "app-rail-signout" }: { className?: string }) {
  if (!clerkEnabled) return null;
  return <SignOutInner className={className} />;
}

function SignOutInner({ className }: { className: string }) {
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
