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
  price: "",
  brand: "",
};

export function AddMaterialForm() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
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

  const addKeyword = (raw: string) => {
    const words = raw.split(",").map((word) => word.trim()).filter(Boolean);
    if (!words.length) return;
    setKeywords((current) => Array.from(new Set([...current, ...words])).slice(0, 12));
    setKeywordDraft("");
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
        keywords,
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
      setKeywords([]);
      chooseFile(null);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSaved(null);
    setDraft(emptyDraft);
    setKeywords([]);
    setKeywordDraft("");
    chooseFile(null);
    setError("");
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
          <span className="admin-rail-link is-active">New material</span>
          <a className="admin-rail-link" href="/builder">Estimate builder</a>
        </aside>

        <main className="admin-main">
          <header className="admin-head">
            <div>
              <h1 className="admin-title">{saved ? "Material added" : "New material"}</h1>
              <p className="admin-sub">
                {saved
                  ? "It is in the catalogue now, with its photo and price."
                  : "One page for everything the catalogue needs: identity, specification, photo and the first price."}
              </p>
            </div>
          </header>

          {saved ? (
            <section className="nm-done">
              <span className="nm-done-mark" aria-hidden="true">✓</span>
              <h2>{saved.name}</h2>
              <p className="admin-note">
                {saved.imageFailed
                  ? `Saved, but the photo did not upload: ${saved.imageFailed}`
                  : file
                    ? "Material, photo and price are saved. The website picks it up within a minute."
                    : "Material and price are saved. The website picks it up within a minute."}
              </p>
              <div className="nm-done-actions">
                <button className="admin-btn admin-btn-amber" type="button" onClick={resetForm}>Add another</button>
                <button className="admin-btn" type="button" onClick={() => router.push("/")}>Back to the console</button>
              </div>
            </section>
          ) : (
            <form className="nm" onSubmit={submit}>
              <div className="nm-grid">
                {/* photo */}
                <section className="nm-card nm-photo-card">
                  <h2 className="nm-title">Photo</h2>
                  <button
                    className={[
                      "nm-drop",
                      preview ? "has-photo" : "",
                      dragging ? "is-dragging" : "",
                    ].filter(Boolean).join(" ")}
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
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="14" rx="2.5" />
                          <path d="m4.5 16 4.2-4.2a2 2 0 0 1 2.8 0l2.1 2.1M14 12.5l1.6-1.6a2 2 0 0 1 2.8 0L21 13.5" strokeLinecap="round" />
                        </svg>
                        <strong>Drop a photo here</strong>
                        <span>or click to choose · JPG, PNG, WebP, AVIF · up to 5 MB</span>
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
                    <div className="nm-photo-actions">
                      <button className="admin-btn" type="button" onClick={() => fileRef.current?.click()}>Replace</button>
                      <button className="admin-btn admin-btn-ghost" type="button" onClick={() => chooseFile(null)}>Remove</button>
                      <span className="nm-file">{file.name} · {Math.round(file.size / 1024)} KB</span>
                    </div>
                  ) : null}
                </section>

                {/* details */}
                <div className="nm-column">
                  <section className="nm-card">
                    <h2 className="nm-title">Identity</h2>
                    <div className="nm-fields">
                      <label className="admin-field nm-wide">
                        <span>Name *</span>
                        <input
                          value={draft.name}
                          onChange={(event) => set("name", event.target.value)}
                          placeholder="13A Double Switched Socket Outlet"
                          required
                        />
                      </label>
                      <label className="admin-field">
                        <span>Code</span>
                        <input value={draft.code} onChange={(event) => set("code", event.target.value)} placeholder="SWS-SOC-13A-2G" />
                      </label>
                      <label className="admin-field">
                        <span>Category</span>
                        <input
                          list="nm-categories"
                          value={draft.category}
                          onChange={(event) => set("category", event.target.value)}
                          placeholder="Switches & Sockets"
                        />
                        <datalist id="nm-categories">
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
                    </div>
                  </section>

                  <section className="nm-card">
                    <h2 className="nm-title">Specification</h2>
                    <div className="nm-fields">
                      <label className="admin-field nm-wide">
                        <span>Specification</span>
                        <textarea
                          rows={3}
                          value={draft.spec}
                          onChange={(event) => set("spec", event.target.value)}
                          placeholder="13A twin switched socket, BS 1363, white moulded plate"
                        />
                      </label>
                      <div className="admin-field nm-wide">
                        <span>Search keywords</span>
                        <div className="nm-keywords">
                          {keywords.map((word) => (
                            <button
                              key={word}
                              type="button"
                              className="nm-keyword"
                              onClick={() => setKeywords((current) => current.filter((entry) => entry !== word))}
                              title="Remove keyword"
                            >
                              {word}<i aria-hidden="true">×</i>
                            </button>
                          ))}
                          <input
                            value={keywordDraft}
                            onChange={(event) => setKeywordDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === ",") {
                                event.preventDefault();
                                addKeyword(keywordDraft);
                              } else if (event.key === "Backspace" && !keywordDraft && keywords.length) {
                                setKeywords((current) => current.slice(0, -1));
                              }
                            }}
                            onBlur={() => addKeyword(keywordDraft)}
                            placeholder={keywords.length ? "Add another" : "double socket, 13A socket"}
                          />
                        </div>
                        <small className="admin-note">Press Enter or comma after each keyword. These drive the catalogue search.</small>
                      </div>
                    </div>
                  </section>

                  <section className="nm-card">
                    <h2 className="nm-title">Price</h2>
                    <div className="nm-fields">
                      <label className="admin-field">
                        <span>Price (GHS)</span>
                        <input
                          inputMode="decimal"
                          value={draft.price}
                          onChange={(event) => set("price", event.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="50"
                        />
                        <small className="admin-note">Leave empty if the price is still being confirmed.</small>
                      </label>
                      <label className="admin-field">
                        <span>Brand</span>
                        <input value={draft.brand} onChange={(event) => set("brand", event.target.value)} placeholder="UNO" />
                      </label>
                    </div>
                  </section>

                  {error ? <p className="admin-error">{error}</p> : null}

                  <div className="nm-submit">
                    <button className="admin-btn admin-btn-amber" type="submit" disabled={saving}>
                      {saving ? "Saving…" : "Add material"}
                    </button>
                    <button className="admin-btn admin-btn-ghost" type="button" onClick={() => router.push("/")}>Cancel</button>
                    <span className="nm-hint">The photo uploads and the price publishes with the material.</span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
