"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AdminSignIn } from "@/components/admin/admin-sign-in";
import { whoAmI } from "@/lib/api/admin";

const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

export default function AdminSettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [admin, setAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void whoAmI().then((me) => setAdmin(Boolean(me?.admin)));
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <p className="admin-sub">Loading…</p>;
  if (!isSignedIn) return <AdminSignIn />;

  return (
    <>
      <header className="admin-head">
        <div>
          <h1 className="admin-title">Settings</h1>
          <p className="admin-sub">Your admin account and the services this app talks to.</p>
        </div>
      </header>

      <section className="admin-panel" style={{ padding: 22, marginTop: 18 }}>
        <h2 className="admin-draft-title" style={{ color: "#0b2142" }}>Account</h2>
        <p className="admin-note">
          <strong>{user?.fullName || user?.username || "Admin"}</strong>
          <br />
          {user?.primaryEmailAddress?.emailAddress ?? "—"}
          <br />
          {admin === null ? "Checking role…" : admin ? "Admin — can edit catalogue and prices" : "Signed in, but not an admin"}
        </p>
        <SignOutButton>
          <button className="admin-btn" type="button" style={{ marginTop: 14 }}>Sign out</button>
        </SignOutButton>
      </section>

      <section className="admin-panel" style={{ padding: 22, marginTop: 18 }}>
        <h2 className="admin-draft-title" style={{ color: "#0b2142" }}>Services</h2>
        <p className="admin-note">
          Catalogue and prices are stored in Cloudflare D1 and read through the ESTIMO data API.
          <br />
          <code style={{ fontSize: 12.5 }}>{API_URL}</code>
        </p>
        <p className="admin-note" style={{ marginTop: 10 }}>
          Currency: Ghana cedi (GHS). Units are edited from the Materials page.
        </p>
      </section>
    </>
  );
}
