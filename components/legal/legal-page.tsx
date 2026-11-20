import type { ReactNode } from "react";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

type LegalPageProps = {
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
};

const ENQUIRIES_NUMBER = "+233 26 400 5400";
const ENQUIRIES_HREF = "tel:+233264005400";

export function LegalPage({ title, summary, updated, sections }: LegalPageProps) {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <div className="legal-hero-inner">
          <div className="legal-hero-copy">
            <p className="legal-eyebrow">Legal</p>
            <h1>{title}</h1>
            <p className="legal-deck">{summary}</p>
          </div>
          <div className="legal-meta">
            <div>
              <span>Last updated</span>
              <strong>{updated}</strong>
            </div>
            <div>
              <span>Applies to</span>
              <strong>The ESTIMO website and web app</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="container legal-layout">
        <aside className="legal-toc">
          <p className="legal-toc-title">On this page</p>
          <ol>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
          <div className="legal-toc-card">
            <span>Questions?</span>
            <a href={ENQUIRIES_HREF}>{ENQUIRIES_NUMBER}</a>
            <p>Call the ESTIMO team about privacy, cookies or your account.</p>
          </div>
        </aside>

        <article className="legal-article">
          {sections.map((section, index) => (
            <section className="legal-section" id={section.id} key={section.id}>
              <div className="legal-section-head">
                <span className="legal-section-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{section.title}</h2>
              </div>
              {section.body}
            </section>
          ))}

          <div className="legal-callout">
            <div>
              <strong>Still have a question?</strong>
              <p>Talk to the ESTIMO team and we will point you to the right answer.</p>
            </div>
            <a href={ENQUIRIES_HREF}>Call {ENQUIRIES_NUMBER}</a>
          </div>
        </article>
      </div>
    </main>
  );
}
