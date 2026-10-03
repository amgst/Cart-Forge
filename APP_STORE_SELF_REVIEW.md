# Cart Forge — Shopify AI self-review

Reviewed October 3, 2026 using the installed Shopify AI Toolkit and Shopify's current requirements fetched with `shopify doc fetch` from the project root.

## Summary

- ✅ Likely passing: **25**
- ❌ Likely failing: **0** in the 31 evaluated local criteria after the fixes below
- ⚠️ Needs review: **6**
- ⏭️ Groups skipped: **10**

**Submission readiness is not confirmed.** This review covers the subset Shopify identifies as checkable against a local codebase without browser context. Shopify will review these and additional requirements upon submission. No deployed configuration, Partner Dashboard settings, live merchant installation, listing, or production data was inspected. Local fixes have not been deployed.

## Fixes completed locally

- **2.3.1 Shopify-owned installation:** removed shop-domain entry forms from the public landing page and `/auth/login`. Merchants are directed to Shopify Admin or the Shopify App Store. Shopify-provided shop query parameters remain supported for authentication.
- **OAuth callback mismatch:** `shopify.app.toml` previously allowed `/api/auth`, but the installed SDK constructs `/auth/callback` from `authPathPrefix: "/auth"`. Corrected the allowed redirect URL to `/auth/callback`.
- **Mandatory privacy webhooks (additional check):** added `customers/data_request`, `customers/redact`, and `shop/redact` subscriptions and `/webhooks/compliance`. Requests authenticate through Shopify's webhook verifier. Shop redaction deletes residual Firestore sessions even when no active session exists. Buyer data requests are acknowledged because this app stores no buyer/customer records. These subscriptions must still be published and tested against the deployed endpoint. Shopify requires all three even when an app does not collect customer data: [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance).

## Requirements that need review

⚠️ **1.1.4 Use only factual information**

**Why this needs attention:** verify the App Store listing, privacy claims, and UI descriptions against actual behavior. The in-app privacy summary is not a complete public privacy policy.

**What was detected:** `app/routes/app.privacy.jsx` describes session storage and uninstall deletion. `app/firebase-session-storage.server.js` persists `session.toPropertyArray(true)`, which may include merchant/staff user fields in addition to authentication credentials. Review disclosure of Firebase processing, retention, contact information, and data subject rights. No fabricated sales/reviews or storefront purchase notifications were detected.

⚠️ **1.2.1 Use Shopify App Pricing or the Shopify Billing API**

**Why this needs attention:** confirm whether the app is genuinely free or uses Shopify App Pricing configured outside this repository. Any app charges must use Shopify billing/pricing; external charging is not permitted.

**What was detected:** no billing calls, paywall, plans, or external payment integrations in the app code. Dashboard pricing and listing prices were unavailable.

⚠️ **1.2.2 Implement Shopify App Pricing or the Shopify Billing API correctly**

**Why this needs attention:** if paid, test charge approval, decline, cancellation, and resubscription after reinstall. If entirely free, this criterion does not require a charge flow.

**What was detected:** no charge lifecycle implementation in local code; Shopify App Pricing settings are not represented here.

⚠️ **1.2.3 Allow pricing plan changes**

**Why this needs attention:** if multiple paid plans exist, confirm self-service upgrades and downgrades without support or reinstall. If free with no plans, this is not applicable.

**What was detected:** no plan-switching interface or billing mutations; external pricing configuration was not accessible.

⚠️ **2.3.3 Redirect to the app UI after installation**

**Why this needs attention:** test fresh installation and reinstall with the production callback configuration. Confirm arrival in `/app` inside Shopify Admin without redirect loops or a dead end.

**What was detected:** Shopify's authenticated route and token exchange infrastructure are present. The callback mismatch was corrected locally, but production configuration and live installation have not been verified.

⚠️ **3.1.1 Use a valid TLS/SSL certificate**

**Why this needs attention:** verify the deployed host's certificate and HTTPS responses, including auth and webhook routes.

**What was detected:** application and redirect URLs use `https://cartforge-one.vercel.app`. A configured HTTPS URL does not prove certificate validity or production availability.

## Likely failing requirements

None identified in the evaluated local subset after the changes. This does not establish that the deployed app or App Store submission meets all requirements.

## Skipped groups

- **5.1 Online store** — no theme app extension.
- **5.2 Payment** — no payment extension or payment gateway scope.
- **5.3 Payment facilitator** — category-specific opt-in not requested.
- **5.4 Purchase option** — no subscription/deferred-payment scopes.
- **5.5 Product sourcing** — category-specific opt-in not requested.
- **5.6 Checkout customization** — the extension is a Shopify Function, not a checkout UI extension. General checkout policy checks were still evaluated.
- **5.7 Sales channel** — no channel configuration extension.
- **5.8 Post purchase** — no post-purchase extension.
- **5.9 Mobile app builders** — category-specific opt-in not requested.
- **5.10 Donation** — category-specific opt-in not requested.

## Evaluation coverage

Each applicable requirement was evaluated in a separate pass against its description and verification guidance. Passing identifiers are recorded for traceability; they are not a certification.

| Group | Likely passing IDs | Needs review IDs | Likely failing IDs |
| --- | --- | --- | --- |
| 1.1 Platform policy | 1.1.1, 1.1.2, 1.1.3, 1.1.6, 1.1.7, 1.1.8, 1.1.9, 1.1.10, 1.1.13, 1.1.14, 1.1.15, 1.1.16 | 1.1.4 | None |
| 1.2 Billing | None | 1.2.1, 1.2.2, 1.2.3 | None |
| 2.2 APIs and platform tools | 2.2.1, 2.2.3, 2.2.4, 2.2.6, 2.2.7 | None | None |
| 2.3 Installation | 2.3.1, 2.3.2, 2.3.4 | 2.3.3 | None |
| 3.1 TLS | None | 3.1.1 | None |
| 3.2 Access scopes | 3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.2.5 | None | None |

Evidence reviewed: application routes, authentication setup, Firestore session storage, Admin GraphQL operations, Function input/query/logic/fixtures, app and extension TOML, dependencies, and the installed AppProvider implementation. The latter supplies the CDN App Bridge script before Polaris and the route UI. No REST Admin API, external checkout/billing, fee additions, payment handling, refund flow, seller marketplace, third-party POS, theme downloads, lending, or promotional admin extensions were detected. Scope configuration requests only `read_products,write_validations`, matching product selection and validation management. Shopify authentication precedes protected UI and storage overwrites sessions by ID, allowing token updates on reinstall.

## Validation

- ESLint: passed.
- React Router type generation / TypeScript: passed. The configured TypeScript include patterns do not constitute strict type checking of all JavaScript/JSX implementation files.
- Production build: passed.
- Rule regression suite: 4 tests passed.
- Checkout integration and compliance handler suite: 11 tests passed, including all seven WASM Function fixtures.
- Compliance tests verify handler behavior and propagation of SDK authentication rejection; they do not constitute live signed/invalid-HMAC webhook delivery tests.
- Toolkit Polaris validator could not start because the installed toolkit lacks its `typescript` dependency. Documentation checks, lint, and production compilation passed, but Toolkit schema validation is unconfirmed.
- No deployment, listing submission, or store mutation was performed. App TOML remote validation and published webhook subscriptions remain unverified.

## Before submission

1. Publish the corrected app configuration and application code, then verify all compliance webhook subscriptions, valid deliveries, invalid-HMAC `401` responses, and shop-data deletion in production.
2. Test fresh installation, uninstallation, and reinstallation; Chrome incognito/blocked third-party cookies; rule creation, editing, activation, duplication, deletion; product and variant pickers; checkout/cart behavior and multi-currency thresholds.
3. Confirm free/paid pricing and any dashboard-managed plan workflows.
4. Supply a public privacy policy and verify listing claims, screenshots, support contacts, reviewer access instructions, and any plan/store eligibility restrictions. These submission details are outside the fetched local checklist and were not accessible here.
5. Verify HTTPS availability and production Firebase credentials/access controls without exposing secrets.

## Resources

- [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Best practices for apps](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices)
- [About billing for your app](https://shopify.dev/docs/apps/launch/billing)
- [Submitting your app for review](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review)
- [Canonical AI self-review requirements](https://shopify.dev/docs/apps/launch/app-store-review/app-store-ai-self-review-requirements)

Fetched source snapshots are saved in `app-store-review-requirements.md` and `privacy-law-review-reference.md`.
