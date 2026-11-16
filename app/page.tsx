import Link from "next/link";
import { FloorPlan } from "@/components/home/floor-plan";

type Template = {
  label: string;
  code: string;
  caption: string;
  featured?: boolean;
};

const homes: Template[] = [
  { label: "Single Room", code: "HOME-1R", caption: "Starter room / compact living" },
  { label: "1-Bedroom Home", code: "HOME-1B", caption: "Small apartment or annex" },
  { label: "2-Bedroom Home", code: "HOME-2B", caption: "Quickest way to a full estimate", featured: true },
  { label: "3-Bedroom Home", code: "HOME-3B", caption: "Family home" },
  { label: "4-Bedroom / Villa", code: "HOME-4B", caption: "Larger premium home" },
];

const commercial: Template[] = [
  { label: "Container / Kiosk", code: "SHOP-KIOSK", caption: "Small shop or roadside kiosk" },
  { label: "Shop / Retail", code: "SHOP-RETAIL", caption: "Retail or mini-mart" },
  { label: "Office", code: "COMM-OFF-S", caption: "Small office space" },
  { label: "Workshop / Small Factory", code: "IND-WORK", caption: "Light industrial space" },
];

function TemplateRow({ label, code, caption, featured }: Template) {
  return (
    <li className="mega-row">
      <div className="mega-row-copy">
        <span className="mega-row-title">
          {label}
          {featured ? <span className="mega-badge">Most used</span> : null}
        </span>
        <span className="mega-row-caption">{caption}</span>
      </div>
      <Link className="mega-row-cta" href={`/quick-estimate?template=${encodeURIComponent(code)}`}>
        Start estimate
      </Link>
    </li>
  );
}

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-copy">
            <p className="home-eyebrow">Electrical estimates, made visible</p>
            <h1>
              Picture it lit.
              <br />
              Then price it.
            </h1>
            <p className="home-lead">
              Choose the closest project and watch every light, socket and circuit appear in a simple first estimate.
              You can adjust the details later.
            </p>
            <div className="home-actions">
              <Link className="home-cta" href="/quick-estimate?template=HOME-2B">Start an estimate</Link>
              <Link className="home-cta-outline" href="/catalogue">Check material prices</Link>
            </div>
            <p className="home-pro">
              <Link href="/projects">Professional / saved projects</Link>
            </p>
          </div>

          <div className="home-plan">
            <FloorPlan />
            <ul className="home-plan-legend">
              <li><span className="plan-symbol plan-symbol-light" aria-hidden="true" />Light point</li>
              <li><span className="plan-symbol plan-symbol-socket" aria-hidden="true" />Socket</li>
              <li><span className="plan-symbol plan-symbol-db" aria-hidden="true">DB</span>Distribution board</li>
              <li><span className="plan-symbol plan-symbol-run" aria-hidden="true" />Circuit run</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="container">
        <section className="mega-lists" aria-label="Project types">
          <div className="mega-column">
            <h2 className="mega-heading">Homes</h2>
            <ul className="mega-list">
              {homes.map((template) => (
                <TemplateRow key={template.code} {...template} />
              ))}
            </ul>
          </div>
          <div className="mega-column">
            <h2 className="mega-heading">Business and commercial</h2>
            <ul className="mega-list">
              {commercial.map((template) => (
                <TemplateRow key={template.code} {...template} />
              ))}
            </ul>
          </div>
        </section>

        <section className="home-bottom">
          <Link className="home-bottom-cta" href="/catalogue">Check material prices</Link>
          <p className="home-bottom-note">
            Need supplier details, SKUs or pricing confidence? Those live in Professional tools, so this screen stays
            simple.
          </p>
        </section>
      </div>
    </main>
  );
}
