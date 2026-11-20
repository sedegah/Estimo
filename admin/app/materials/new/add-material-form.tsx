"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingScreen } from "../../loading-screen";
import { addItem, listCatalogue, setPrice, uploadMaterialImage } from "@/lib/api";

const UNITS = ["No.", "m", "length", "roll", "set", "strip", "lot", "bag", "coil", "box", "pack", "pair"];
const RELEVANCE = ["High", "Medium", "Low"];
const TIERS = ["All", "Value / Standard", "Standard", "Standard / Premium", "Premium"];

type Draft = {
  name: string;
  code: string;
  category: string;
  unit: string;
  spec: string;
  tier: string;
  relevance: string;
  keywords: string;
  price: string;
  brand: string;
};

const emptyDraft: Draft = {
  name: "",
  code: "",
  category: "",
  unit: "No.",
  spec: "",
  tier: "All",
  relevance: "Medium",
  keywords: "",
  price: "",
  brand: "",
};

export function AddMaterialForm() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [categories, setCategories] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: string; name: string; imageFailed?: string } | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void listCatalogue().then((items) => {
      const unique = Array.from(new Set((items ?? []).map((item) => item.category).filter(Boolean))).sort();
      setCategories(unique);
    });
  }, [isLoaded, isSignedIn]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const chooseFile = (next: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : "");
  };

  const price = useMemo(() => {
    if (draft.price.trim() === "") return null;
    const value = Number(draft.price);
    return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
  }, [draft.price]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) { setError("A material name is required."); return; }
    if (price !== null && Number.isNaN(price)) { setError("The price must be a number, or left empty."); return; }

    setSaving(true);
    setError("");
    try {
      const created = await addItem({
        name: draft.name.trim(),
        code: draft.code.trim() || undefined,
        category: draft.category.trim() || undefined,
        unit: draft.unit,
        spec: draft.spec.trim() || undefined,
        tier: draft.tier,
        relevance: draft.relevance,
        keywords: draft.keywords.split(",").map((word) => word.trim()).filter(Boolean),
      });
      if (!created.ok || !created.id) {
        setError(created.error ?? "The material could not be saved.");
        return;
      }

      let imageFailed: string | undefined;
      if (file) {
        const uploaded = await uploadMaterialImage(created.id, file);
        if (!uploaded.ok) imageFailed = uploaded.error ?? "The photo could not be uploaded.";
      }
      if (price !== null) {
        const priced = await setPrice(created.id, price, draft.brand.trim() || undefined);
        if (!priced.ok) imageFailed = priced.error ?? imageFailed;
      }

      setSaved({ id: created.id, name: draft.name.trim(), imageFailed });
      setDraft(emptyDraft);
      chooseFile(null);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) {
    return (
      <div className="admin-auth-wrap">
        <SignIn routing="hash" />
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/brand/estimo-logo-horizontal-dark.png" alt="ESTIMO" className="admin-brand-logo" />
          <span className="admin-brand-admin">admin</span>
        </div>
        <div className="admin-user">
          <Link className="admin-btn" href="/">Back to console</Link>
        </div>
      </header>

      <div className="admin-body">
        <aside className="admin-rail">
          <p className="admin-rail-label">Manage</p>
          <Link className="admin-rail-link" href="/">Prices</Link>
          <Link className="admin-rail-link" href="/">Materials</Link>
          <span className="admin-rail-link is-active">Add material</span>
        </aside>

        <main className="admin-main">
          <header className="admin-head">
            <div>
              <h1 className="admin-title">Add material</h1>
              <p className="admin-sub">Create a catalogue material with its specification, photo and starting price.</p>
            </div>
          </header>

          {saved ? (
            <div className="admin-panel material-saved">
              <h2>“{saved.name}” was added</h2>
              <p className="admin-note">
                {saved.imageFailed
                  ? `The material is saved, but the photo did not upload: ${saved.imageFailed}`
                  : file ? "The material, its photo and its price are saved." : "The material is saved."}
              </p>
              <div className="admin-actions" style={{ marginTop: 12 }}>
                <button className="admin-btn admin-btn-amber" type="button" onClick={() => setSaved(null)}>Add another</button>
                <button className="admin-btn" type="button" onClick={() => router.push("/")}>Back to the console</button>
              </div>
            </div>
          ) : (
            <form className="material-form" onSubmit={submit}>
              <section className="admin-panel material-photo-panel">
                <h2 className="material-form-title">Photo</h2>
                <button
                  className={preview ? "material-photo-drop has-photo" : "material-photo-drop"}
                  type="button"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview of the material photo" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="14" rx="2.5" />
                        <path d="m4.5 16 4.2-4.2a2 2 0 0 1 2.8 0l2.1 2.1M14 12.5l1.6-1.6a2 2 0 0 1 2.8 0L21 13.5" strokeLinecap="round" />
                      </svg>
                      <strong>Choose a photo</strong>
                      <span>JPG, PNG, WebP or AVIF · up to 5 MB</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  hidden
                  onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                />
                {preview ? (
                  <div className="admin-actions" style={{ marginTop: 10 }}>
                    <button className="admin-btn" type="button" onClick={() => fileRef.current?.click()}>Change photo</button>
                    <button className="admin-btn admin-btn-ghost" type="button" onClick={() => chooseFile(null)}>Remove</button>
                  </div>
                ) : null}
              </section>

              <section className="admin-panel">
                <h2 className="material-form-title">Details</h2>
                <div className="material-form-grid">
                  <label className="admin-field">
                    <span>Name *</span>
                    <input value={draft.name} onChange={(event) => set("name", event.target.value)} placeholder="13A Double Switched Socket Outlet" required />
                  </label>
                  <label className="admin-field">
                    <span>Code</span>
                    <input value={draft.code} onChange={(event) => set("code", event.target.value)} placeholder="SWS-SOC-13A-2G" />
                  </label>
                  <label className="admin-field">
                    <span>Category</span>
                    <input list="material-categories" value={draft.category} onChange={(event) => set("category", event.target.value)} placeholder="Switches & Sockets" />
                    <datalist id="material-categories">
                      {categories.map((category) => <option key={category} value={category} />)}
                    </datalist>
                  </label>
                  <label className="admin-field">
                    <span>Base unit</span>
                    <select value={draft.unit} onChange={(event) => set("unit", event.target.value)}>
                      {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Quality tier</span>
                    <select value={draft.tier} onChange={(event) => set("tier", event.target.value)}>
                      {TIERS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Quick-build relevance</span>
                    <select value={draft.relevance} onChange={(event) => set("relevance", event.target.value)}>
                      {RELEVANCE.map((level) => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </label>
                  <label className="admin-field material-field-wide">
                    <span>Specification</span>
                    <textarea rows={2} value={draft.spec} onChange={(event) => set("spec", event.target.value)} placeholder="13A twin switched socket, BS type" />
                  </label>
                  <label className="admin-field material-field-wide">
                    <span>Search keywords</span>
                    <input value={draft.keywords} onChange={(event) => set("keywords", event.target.value)} placeholder="double socket, 13A socket" />
                    <small className="admin-note">Separate with commas; these drive the catalogue search.</small>
                  </label>
                </div>

                <h2 className="material-form-title" style={{ marginTop: 20 }}>Price</h2>
                <div className="material-form-grid">
                  <label className="admin-field">
                    <span>Price (GHS)</span>
                    <input
                      inputMode="decimal"
                      value={draft.price}
                      onChange={(event) => set("price", event.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="50"
                    />
                  </label>
                  <label className="admin-field">
                    <span>Brand</span>
                    <input value={draft.brand} onChange={(event) => set("brand", event.target.value)} placeholder="UNO" />
                  </label>
                </div>

                {error ? <p className="admin-error">{error}</p> : null}

                <div className="admin-actions" style={{ marginTop: 16 }}>
                  <button className="admin-btn admin-btn-amber" type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Add material"}
                  </button>
                  <button className="admin-btn admin-btn-ghost" type="button" onClick={() => router.push("/")}>Cancel</button>
                </div>
              </section>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
