/** Storage key and open event for the ESTIMO cookie notice. */

export const COOKIE_NOTICE_STORAGE_KEY = "estimo_cookie_notice_v1";
export const COOKIE_NOTICE_OPEN_EVENT = "estimo-cookie-open";

export function openCookieNotice(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(COOKIE_NOTICE_OPEN_EVENT));
  }
}
