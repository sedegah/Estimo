"use client";

import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { clerkEnabled } from "@/lib/env";
import { readPreferences, savePreferences, type Preferences } from "@/lib/storage/preferences";

type AccountType = "homeowner" | "professional";

export default function SettingsPage() {
  const [accountType, setAccountType] = useState<AccountType>("homeowner");
  const [preferences, setPreferences] = useState<Preferences>({ currency: "GHS", unit: "metric" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPreferences(readPreferences());
  }, []);

  const save = () => {
    savePreferences(preferences);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <header className="app-head">
        <div>
          <p className="app-eyebrow">Your account</p>
          <h1 className="app-title">Settings</h1>
          <p className="app-sub">
            {clerkEnabled
              ? "Profile, password and sign-in are managed securely by Clerk. These defaults stay on this device."
              : "Estimate defaults are stored in this browser."}
          </p>
        </div>
        <div className="settings-actions">
          {clerkEnabled ? <SignOutButton className="btn-outline" /> : null}
          <button className="btn-amber" type="button" onClick={save}>
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="settings-grid">
        <section className="panel">
          <h2 className="panel-title">Profile</h2>
          <p className="settings-note" style={{ marginTop: 0 }}>
            {clerkEnabled
              ? "Name, email, password and Google sign-in are handled by Clerk. Use the account button in the header to manage them."
              : "Authentication is not configured on this build. Guests can estimate and save locally."}
          </p>
        </section>

        <section className="panel">
          <h2 className="panel-title">Account type</h2>
          <div className="settings-radios">
            <label>
              <input
                type="radio"
                name="account-type"
                checked={accountType === "homeowner"}
                onChange={() => setAccountType("homeowner")}
              />
              Homeowner
            </label>
            <label>
              <input
                type="radio"
                name="account-type"
                checked={accountType === "professional"}
                onChange={() => setAccountType("professional")}
              />
              Professional
            </label>
          </div>
          <p className="settings-note">Used to label your workspace. It never affects estimate maths.</p>
        </section>

        <section className="panel">
          <h2 className="panel-title">Estimate defaults</h2>
          <div className="settings-row two">
            <div className="settings-field">
              <label htmlFor="settings-currency">Currency</label>
              <select
                id="settings-currency"
                value={preferences.currency}
                onChange={(event) => setPreferences({ ...preferences, currency: event.target.value as Preferences["currency"] })}
              >
                <option value="GHS">Ghana cedi (GH₵)</option>
                <option value="USD">US dollar ($)</option>
              </select>
            </div>
            <div className="settings-field">
              <label htmlFor="settings-unit">Unit</label>
              <select
                id="settings-unit"
                value={preferences.unit}
                onChange={(event) => setPreferences({ ...preferences, unit: event.target.value as Preferences["unit"] })}
              >
                <option value="metric">Metric (m, mm)</option>
                <option value="imperial">Imperial (ft, in)</option>
              </select>
            </div>
          </div>
          <p className="settings-note">Defaults apply to new estimates; existing estimates keep their own values.</p>
        </section>
      </div>
    </>
  );
}
