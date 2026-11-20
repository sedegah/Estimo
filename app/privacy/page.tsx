import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy | ESTIMO",
  description: "How ESTIMO handles personal information for estimates, accounts, saved projects and enquiries.",
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          ESTIMO provides electrical estimating tools for people planning work in Ghana. This policy explains what
          personal information we handle when you use the ESTIMO website and web app, why we handle it, and the
          choices you have.
        </p>
        <p>
          ESTIMO is responsible for the personal information described in this policy. For a privacy question, request
          or complaint, call <a href="tel:+233264005400">+233 26 400 5400</a>.
        </p>
        <p>
          In this policy, “we”, “us” and “our” mean ESTIMO. “You” means the person using ESTIMO.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>The information we handle falls into four groups.</p>

        <h3>Account information</h3>
        <p>
          If you create an account, Clerk, our sign-in provider, handles your name, email address, profile image and
          sign-in identifiers. Clerk also records security information such as your IP address and browser or device
          details.
        </p>
        <p>Your password is handled by Clerk. ESTIMO never receives or stores it.</p>

        <h3>Estimate and project information</h3>
        <p>
          Depending on what you use, this can include the project type, number of rooms or spaces, fitting quality, line
          items, quantities, totals, estimate names and the dates you save or update an estimate.
        </p>
        <p>
          It also includes the materials in your estimate basket, your last estimate draft and display preferences such
          as currency and units.
        </p>

        <h3>Enquiry information</h3>
        <p>
          If you call us, we receive your phone number and any details you choose to share about your project, question
          or request.
        </p>

        <h3>Technical and security information</h3>
        <p>
          Our website host, API host and sign-in provider may process standard technical information such as your IP
          address, browser and device type, the pages you request, timestamps and error details. We use this to keep
          ESTIMO available, diagnose faults and protect accounts.
        </p>
      </>
    ),
  },
  {
    id: "guest-and-account",
    title: "Guest use and signed-in use",
    body: (
      <>
        <p>
          You can use ESTIMO without an account. In guest mode, your saved estimates, basket, draft, preferences and an
          account marker are stored in your browser’s local storage. They stay on that device and are not sent to our
          database. Clearing your browser’s site data removes them.
        </p>
        <p>
          If you sign in and save an estimate, the app syncs it to our API and stores it in Cloudflare D1 against a
          hashed owner key derived from your Clerk user ID. The raw Clerk user ID is not used as the database isolation
          key.
        </p>
        <p>
          If you start as a guest and then sign in, estimates already saved in that browser are uploaded to your
          account. Signing out, or signing in with a different account, clears the previous account’s local data.
        </p>
        <p>
          When you download a PDF, it is generated on demand from the estimate details and returned to your browser. The
          PDF route does not keep a copy of the document.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use your information",
    body: (
      <>
        <p>We use personal information to:</p>
        <ul>
          <li>build your estimate, calculate the breakdown and show material prices;</li>
          <li>save projects, keep your basket and sync saved estimates across your devices;</li>
          <li>generate the PDF you ask to download;</li>
          <li>sign you in, secure your account and prevent misuse of the service;</li>
          <li>respond to your enquiries and support requests;</li>
          <li>
            send occasional account messages, including the monthly ESTIMO check-in email where it applies, with a way
            to opt out;
          </li>
          <li>keep the service reliable, diagnose faults and improve how it works;</li>
          <li>comply with the law and protect our legal rights.</li>
        </ul>
        <p>
          We do not sell personal information, and we do not use it for third-party advertising or advertising
          profiles.
        </p>
      </>
    ),
  },
  {
    id: "legal-bases",
    title: "Our legal bases",
    body: (
      <>
        <p>
          Under Ghana’s Data Protection Act, 2012 (Act 843), we rely on one or more of these bases depending on what we
          are doing:
        </p>
        <ul>
          <li>
            <strong>Your consent</strong> for optional communications, such as the monthly check-in, and for anything
            else we ask your permission for. You can withdraw consent at any time.
          </li>
          <li>
            <strong>Providing the service</strong> to create your account, save and sync estimates, keep your basket and
            produce a PDF.
          </li>
          <li>
            <strong>Our legitimate interests</strong> in keeping ESTIMO secure and reliable, preventing abuse,
            responding to enquiries and improving the service, balanced against your rights.
          </li>
          <li>
            <strong>Legal obligations</strong> where we are required to keep or disclose information.
          </li>
        </ul>
        <p>
          Where we rely on consent, you can withdraw it by calling <a href="tel:+233264005400">+233 26 400 5400</a>.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We share only what is needed with the providers that run ESTIMO:</p>
        <ul>
          <li>
            <strong>Clerk</strong> for sign-in, account management and session security;
          </li>
          <li>
            <strong>Cloudflare</strong> for API hosting, the D1 database, image storage and the monthly email worker;
          </li>
          <li>
            <strong>Vercel</strong> for hosting and delivering the website;
          </li>
          <li>
            <strong>Resend</strong> for sending the monthly check-in email when that service is enabled.
          </li>
        </ul>
        <p>
          These providers may process information outside Ghana and have their own security and privacy commitments. We
          choose providers that apply appropriate safeguards for the data they handle.
        </p>
        <p>
          We may also disclose information if the law requires it, to protect the rights or safety of ESTIMO or others,
          or as part of a transfer of the service to a new operator, with notice where required. Links to supplier or
          other third-party websites are not covered by this policy.
        </p>
        <p>We do not sell personal information.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <ul>
          <li>
            <strong>Guest browser data</strong> stays until you delete it, clear site data, sign out or switch accounts.
          </li>
          <li>
            <strong>Account and saved estimates</strong> stay until you delete them or ask us to delete your account.
            Deleted items may remain in backups for a limited period before those backups are replaced.
          </li>
          <li>
            <strong>Clerk account records</strong> stay until your account is deleted, subject to Clerk’s own retention
            settings.
          </li>
          <li>
            <strong>Enquiry records</strong> stay for as long as needed to resolve the enquiry and keep a reasonable
            record of it.
          </li>
          <li>
            <strong>Monthly check-in emails</strong> continue until you opt out or delete your account.
          </li>
          <li>
            <strong>Technical and security logs</strong> are kept for a short period unless they are needed to
            investigate a security issue or are required by law.
          </li>
        </ul>
        <p>Where the law requires a longer retention period, we keep the information for that period.</p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <>
        <p>
          ESTIMO is served over HTTPS. Sign-in sessions are issued by Clerk, and our API checks the session token on
          every request before returning or changing data. Saved estimates are scoped to a hashed owner key, and only
          the people who need access for support or administration can reach the underlying systems.
        </p>
        <p>
          No internet service is completely secure. If you think your account or information has been compromised, call
          us on <a href="tel:+233264005400">+233 26 400 5400</a> so we can help.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under Act 843, you can ask to:</p>
        <ul>
          <li>see the personal information we hold about you;</li>
          <li>correct information that is wrong or incomplete;</li>
          <li>delete information we no longer need to keep;</li>
          <li>restrict or object to certain processing;</li>
          <li>receive a copy of information you gave us in a usable format where that applies;</li>
          <li>withdraw consent where we rely on it.</li>
        </ul>
        <p>
          To make a request, call <a href="tel:+233264005400">+233 26 400 5400</a>. We may ask you to confirm your
          identity before acting. We respond without undue delay and normally within 30 days.
        </p>
        <p>
          If you are not satisfied with our response, you can complain to Ghana’s{" "}
          <a href="https://dataprotection.org.gh/" target="_blank" rel="noreferrer">
            Data Protection Commission
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and browser storage",
    body: (
      <>
        <p>
          We use a small number of strictly necessary cookies from Clerk to keep you signed in. Guest estimates and
          preferences use browser local storage rather than cookies. We do not run advertising or analytics cookies.
        </p>
        <p>
          We also store a small marker in local storage so the cookie notice does not appear more than once a day. You
          can remove it, along with the rest of ESTIMO’s site data, through your browser settings.
        </p>
        <p>
          The cookie notice in the corner of the site explains what is stored and how to manage it. You can reopen it
          from the Cookies link in the footer at any time.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        ESTIMO is made for people planning electrical work and is not directed at children under 18. We do not
        knowingly collect personal information from children. If you believe a child has given us personal
        information, call us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy when the service or the law changes. The date at the top of the page shows the latest
        version. If a change materially affects how we use your information, we will take reasonable steps to let you
        know before it applies. Please check this page occasionally.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      summary="What ESTIMO collects, why we collect it, who we share it with, and the choices you have over your information."
      updated="20 November 2026"
      sections={sections}
    />
  );
}
