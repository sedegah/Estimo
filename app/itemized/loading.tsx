/** Opens the itemized view instantly while its estimate payload loads. */
export default function ItemizedLoading() {
  return (
    <main className="quantities-page">
      <section className="quantities-hero">
        <div className="container">
          <p className="eyebrow">Your estimate</p>
          <h1 className="quantities-title">What the job needs.</h1>
        </div>
      </section>
      <div className="container quantities-body">
        <div className="quantities-skeleton">
          <span className="quantities-skeleton-bar" />
          <span className="quantities-skeleton-row" />
          <span className="quantities-skeleton-row" />
          <span className="quantities-skeleton-row" />
        </div>
      </div>
    </main>
  );
}
