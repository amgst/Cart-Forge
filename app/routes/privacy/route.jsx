import styles from "./styles.module.css";

const CONTACT_EMAIL = "privacy@example.com"; // TODO: replace with the real support address
const LAST_UPDATED = "October 5, 2026";

export const meta = () => [
  { title: "Privacy Policy | Cart Forge" },
  {
    name: "description",
    content: "How the Cart Forge Shopify app collects, uses, and deletes data.",
  },
];

export default function PrivacyPolicy() {
  return (
    <main className={styles.page}>
      <article className={styles.content}>
        <p className={styles.eyebrow}>
          <a href="/">Cart Forge</a>
        </p>
        <h1>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>

        <p>
          Cart Forge ("the App", "we", "us") is a Shopify app that lets
          merchants create checkout validation rules for their store. This
          policy explains what information the App collects, how it is used,
          and how it is deleted when a merchant installs and uses the App.
        </p>

        <h2>Information we collect</h2>
        <h3>Merchant and store information</h3>
        <p>
          When you install the App, Shopify gives us an authentication session
          for your store. We store this session so you stay signed in. It
          contains your shop domain, the access token and permissions (scopes)
          granted to the App, and, where Shopify provides it, basic details of
          the staff account that opened the App, such as name, email address,
          and account ID.
        </p>
        <h3>Rule settings</h3>
        <p>
          Rule names, conditions, selected products, customer-facing messages,
          and statuses are saved in your Shopify store as part of the Cart
          Forge checkout validation. They are not copied to a separate Cart
          Forge database.
        </p>
        <h3>Product information</h3>
        <p>
          The App reads product titles and images from your store only when you
          choose products for a rule, so they can be shown in the App. This
          information is not stored by us.
        </p>
        <h3>Customer and order information</h3>
        <p>
          The App does not collect or store personal information about your
          customers. At checkout, the validation runs inside Shopify and checks
          cart contents and totals to decide whether a rule is met. Cart and
          customer data are processed by Shopify and are not sent to or kept by
          Cart Forge.
        </p>

        <h2>Permissions we request</h2>
        <ul>
          <li>
            <strong>read_products</strong>: to let you pick products when
            building a rule.
          </li>
          <li>
            <strong>write_validations</strong>: to create and update the
            checkout validation that enforces your rules.
          </li>
        </ul>

        <h2>How we use information</h2>
        <p>We use the information above only to:</p>
        <ul>
          <li>authenticate you and keep you signed in to the App;</li>
          <li>create, display, and enforce the rules you configure;</li>
          <li>respond to support requests; and</li>
          <li>comply with Shopify requirements and applicable law.</li>
        </ul>
        <p>
          We do not sell personal information, share it for advertising, or use
          it to build profiles.
        </p>

        <h2>Service providers</h2>
        <p>We rely on the following providers to run the App:</p>
        <ul>
          <li>
            <strong>Shopify</strong>: hosts your store data, rule settings, and
            runs the checkout validation.
          </li>
          <li>
            <strong>Vercel</strong>: hosts the App's web application.
          </li>
          <li>
            <strong>Google Firebase (Cloud Firestore)</strong>: stores
            authentication sessions.
          </li>
        </ul>
        <p>
          These providers process data on our behalf and may store it in
          countries other than your own, including the United States.
        </p>

        <h2>Data retention and deletion</h2>
        <ul>
          <li>
            Sessions are deleted when you uninstall the App.
          </li>
          <li>
            When Shopify sends a shop redaction request (sent 48 hours after
            uninstall), we delete any remaining sessions for that store.
          </li>
          <li>
            Rule settings live in your Shopify store and are managed by Shopify
            under its own retention rules.
          </li>
        </ul>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access,
          correct, delete, or receive a copy of your personal information, and
          to object to or restrict its processing. To make a request, email us
          at the address below. Because the App stores no customer data,
          requests from your customers that Shopify forwards to us (customer
          data requests and redaction requests) are acknowledged with no data
          to return or delete.
        </p>

        <h2>Security</h2>
        <p>
          Data is sent over HTTPS. Webhooks from Shopify are verified before we
          act on them, and access to stored sessions is limited to the App.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The date at the top
          shows when it was last changed.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests about privacy:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </article>
    </main>
  );
}
