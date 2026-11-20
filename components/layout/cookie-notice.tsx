"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { COOKIE_NOTICE_OPEN_EVENT, COOKIE_NOTICE_STORAGE_KEY } from "@/lib/cookie-notice";

const AUTH_ROUTES = ["/signin", "/signup", "/sso-callback"];
const APP_ROUTES = ["/dashboard", "/estimates", "/projects", "/settings"];

/** Local calendar day, so the notice appears at most once per day in the visitor's timezone. */
function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CookieNotice() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isAppRoute = APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const hidden = isAuthRoute || isAppRoute;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: number | undefined;
    const today = todayKey();

    const rememberToday = () => {
      try {
        window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, today);
      } catch {
        // The notice can still close for this visit.
      }
    };

    try {
      if (window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) !== today) {
        timer = window.setTimeout(() => {
          setOpen(true);
          rememberToday();
        }, 850);
      }
    } catch {
      // Storage is blocked; still show the notice for this visit.
      timer = window.setTimeout(() => setOpen(true), 850);
    }

    const reopen = () => {
      rememberToday();
      setOpen(true);
    };
    window.addEventListener(COOKIE_NOTICE_OPEN_EVENT, reopen);

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener(COOKIE_NOTICE_OPEN_EVENT, reopen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setVisible(true));

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        try {
          window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, todayKey());
        } catch {
          // The notice can still close for this visit.
        }
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const dismiss = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, todayKey());
    } catch {
      // The notice can still close for this visit.
    }
  };

  if (hidden || !open) return null;

  return (
    <aside
      className={visible ? "cookie-popup is-visible" : "cookie-popup"}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-notice-title"
      aria-live="polite"
    >
      <div className="cookie-popup-head">
        <span className="cookie-popup-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.5 12.4A8.5 8.5 0 1 1 11.6 3.5a3.4 3.4 0 0 0 4.9 4.9 3.4 3.4 0 0 0 4 4Z" />
            <circle cx="8.5" cy="10" r=".85" fill="currentColor" stroke="none" />
            <circle cx="11.5" cy="14.5" r=".85" fill="currentColor" stroke="none" />
            <circle cx="7" cy="15.5" r=".85" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div className="cookie-popup-heading">
          <p className="cookie-popup-eyebrow">Cookies</p>
          <h2 id="cookie-notice-title">A quick note about cookies</h2>
        </div>
        <button className="cookie-popup-close" type="button" onClick={dismiss} aria-label="Close cookie notice">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <p className="cookie-popup-copy">
        ESTIMO uses only the cookies needed to keep you signed in and secure. Your estimates stay in this browser
        unless you sign in to save them.
      </p>

      <ul className="cookie-popup-chips" aria-label="Cookie summary">
        <li>Sign-in only</li>
        <li>No ads</li>
        <li>No analytics</li>
      </ul>

      <div className="cookie-popup-actions">
        <button className="cookie-popup-accept" type="button" onClick={dismiss}>
          Got it
        </button>
        <Link className="cookie-popup-link" href="/privacy#cookies" onClick={dismiss}>
          Privacy policy
        </Link>
      </div>

      <p className="cookie-popup-note">You can clear them any time in your browser settings.</p>
    </aside>
  );
}
