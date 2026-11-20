"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingScreen } from "../../loading-screen";
import { addItem, listCatalogue, setPrice, uploadMaterialImage } from "@/lib/api";

const UNITS = ["No.", "m", "length", "roll", "set", "strip", "lot", "bag", "coil", "box", "pack", "pair"];
const TIERS = ["All", "Value / Standard", "Standard", "Standard / Premium", "Premium"];
const RELEVANCE = ["High", "Medium", "Low"];

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
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: string; name: string; imageFailed?: string } | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const stored = localStorage.getItem("estimo-admin-settings");
      if (stored) {
        const parsed = JSON.parse(stored) as { tier?: string; relevance?: string };
        setDraft((current) => ({
          ...current,
          tier: parsed.tier ?? current.tier,
          relevance: parsed.relevance ?? current.relevance,
        }));
      }
    } catch {}
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
    if (next && !next.type.startsWith("image/")) {
      setError("Choose an image file: JPG, PNG, WebP or AVIF.");
      return;
    }
    if (next && next.size > 5 * 1024 * 1024) {
      setError("That photo is larger than 5 MB. Choose a smaller one.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : "");
    setError("");
  };

  const price = useMemo(() => {
    if (draft.price.trim() === "") return null;
    const value = Number(draft.price);
    return Number.isFinite(value) && value >= 0 ? value : Number.NaN;
  }, [draft.price]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setError("A material name is required.");
      return;
    }
    if (price !== null && Number.isNaN(price)) {
      setError("The price must be a number, or left empty.");
      return;
    }

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
      <div className="auth-wrap">
        <SignIn routing="hash" />
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">e</span>
          <span className="brand-name">estimo</span>
          <span className="brand-role">admin</span>
        </div>
        <div className="topbar-right">
          <Link className="btn btn-outline-light btn-sm" href="/">Back to console</Link>
        </div>
      </header>

      <div className="body">
        <aside className="rail">
          <p className="rail-label">Manage</p>
          <Link className="rail-item" href="/">Prices</Link>
          <Link className="rail-item" href="/">Materials</Link>
          <span className="rail-item is-active">Add material</span>
          <a className="rail-item" href="/builder">Estimate builder</a>
        </aside>

        <main className="main">
          <Link className="back-link" href="/">
            ← Back to materials
          </Link>
          <header className="head">
            <div>
              <h1>{saved ? "Material added" : "Add material"}</h1>
              <p>Create a catalogue material with its specification, photo and starting price.</p>
            </div>
          </header>

          {saved ? (
            <section className="card saved-card">
              <div className="saved-mark">✓</div>
              <h2>{saved.name}</h2>
              <p className="form-note">
                {saved.imageFailed
                  ? `Saved, but the photo did not upload: ${saved.imageFailed}`
                  : file
                    ? "Material, photo and price are saved. The estimating app picks it up within a minute."
                    : "Material and price are saved. The estimating app picks it up within a minute."}
              </p>
              <div className="form-actions" style={{ marginTop: 18 }}>
                <button className="btn btn-amber" type="button" onClick={() => { setSaved(null); setDraft(emptyDraft); }}>Add another</button>
                <button className="btn" type="button" onClick={() => router.push("/")}>Back to console</button>
              </div>
            </section>
          ) : (
            <form className="form-grid" onSubmit={submit}>
              <div className="stack">
                <section className="panel">
                  <div className="panel-head"><h2>Basics</h2></div>
                  <div className="panel-body">
                    <label className="field">
                      <span>Name *</span>
                      <input
                        value={draft.name}
                        onChange={(event) => set("name", event.target.value)}
                        placeholder="13A Double Switched Socket Outlet"
                        required
                      />
                    </label>
                    <div className="field-row">
                      <label className="field">
                        <span>Code</span>
                        <input value={draft.code} onChange={(event) => set("code", event.target.value)} placeholder="SWS-SOC-13A-2G" />
                      </label>
                      <label className="field">
                        <span>Category</span>
                        <select value={draft.category} onChange={(event) => set("category", event.target.value)}>
                          <option value="">Choose a category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head"><h2>Specification and search</h2></div>
                  <div className="panel-body">
                    <label className="field">
                      <span>Specification</span>
                      <textarea
                        rows={3}
                        value={draft.spec}
                        onChange={(event) => set("spec", event.target.value)}
                        placeholder="13A twin switched socket, BS type"
                      />
                    </label>
                    <label className="field">
                      <span>Search keywords</span>
                      <input
                        value={draft.keywords}
                        onChange={(event) => set("keywords", event.target.value)}
                        placeholder="double socket, 13A socket"
                      />
                      <small>Separate with commas. These drive the catalogue search.</small>
                    </label>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head"><h2>Estimating settings</h2></div>
                  <div className="panel-body">
                    <div className="field-row">
                      <label className="field">
                        <span>Base unit</span>
                        <select value={draft.unit} onChange={(event) => set("unit", event.target.value)}>
                          {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                      </label>
                      <label className="field">
                        <span>Quality tier</span>
                        <select value={draft.tier} onChange={(event) => set("tier", event.target.value)}>
                          {TIERS.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                        </select>
                      </label>
                      <label className="field">
                        <span>Quick-build relevance</span>
                        <select value={draft.relevance} onChange={(event) => set("relevance", event.target.value)}>
                          {RELEVANCE.map((level) => <option key={level} value={level}>{level}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                </section>
              </div>

              <div className="stack">
                <section className="panel">
                  <div className="panel-head"><h2>Photo</h2></div>
                  <div className="panel-body">
                    <button
                      className={["dropzone", preview ? "has-photo" : "", dragging ? "is-dragging" : ""].filter(Boolean).join(" ")}
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        chooseFile(event.dataTransfer.files?.[0] ?? null);
                      }}
                    >
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="Preview of the material photo" />
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="14" rx="2.5" />
                            <path d="m4.5 16 4.2-4.2a2 2 0 0 1 2.8 0l2.1 2.1M14 12.5l1.6-1.6a2 2 0 0 1 2.8 0L21 13.5" />
                          </svg>
                          <strong>Choose a photo</strong>
                          <span>JPG, PNG, WebP or AVIF, up to 5 MB</span>
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
                    {file ? (
                      <div className="form-actions">
                        <button className="btn btn-sm" type="button" onClick={() => fileRef.current?.click()}>Replace</button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => chooseFile(null)}>Remove</button>
                        <span className="form-note">{file.name}</span>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-head"><h2>Starting price</h2></div>
                  <div className="panel-body">
                    <label className="field">
                      <span>Price</span>
                      <div className="money-input">
                        <span>GHS</span>
                        <input
                          inputMode="decimal"
                          value={draft.price}
                          onChange={(event) => set("price", event.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="0.00"
                        />
                      </div>
                    </label>
                    <label className="field">
                      <span>Brand</span>
                      <input value={draft.brand} onChange={(event) => set("brand", event.target.value)} placeholder="UNO" />
                    </label>
                  </div>
                </section>

                {error ? <p className="banner banner-error">{error}</p> : null}

                <div className="form-actions">
                  <button className="btn btn-amber" type="submit" disabled={saving} style={{ flex: 1 }}>
                    {saving ? "Saving…" : "Add material"}
                  </button>
                  <button className="btn" type="button" onClick={() => router.push("/")}>Cancel</button>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
