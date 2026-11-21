import Link from "next/link";

/**
 * Fills the area under the auth card on phones, so the screen ends on the product
 * rather than on empty space. Hidden on desktop, where the split layout fills it.
 */
export function AuthExtra() {
  return (
    <div className="auth-extra">
      <ul className="auth-benefits">
        <li>
          <span className="auth-tick" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 10.5 4 4 8-9" />
            </svg>
          </span>
          <div>
            <strong>Your estimates, kept</strong>
            <span>Saved projects follow your account to any device.</span>
          </div>
        </li>
        <li>
          <span className="auth-tick" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 10.5 4 4 8-9" />
            </svg>
          </span>
          <div>
            <strong>Prices checked against suppliers</strong>
            <span>Material prices carry the date they were verified.</span>
          </div>
        </li>
        <li>
          <span className="auth-tick" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 10.5 4 4 8-9" />
            </svg>
          </span>
          <div>
            <strong>Start before you sign in</strong>
            <span>Estimate as a guest; the work is adopted when you create the account.</span>
          </div>
        </li>
      </ul>

      <p className="auth-extra-foot">
        <Link href="/">Back to ESTIMO</Link>
        <span>Electrical estimating for Ghana</span>
      </p>
    </div>
  );
}
