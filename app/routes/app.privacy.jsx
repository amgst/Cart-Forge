import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

const ITEMS = [
  {
    title: "Rule settings",
    detail:
      "Rule names, conditions, selected products, customer messages, and statuses are saved in your Shopify store, on the Cart Forge checkout validation. They aren't stored on a separate Cart Forge server.",
  },
  {
    title: "Shopify store data",
    detail:
      "Cart Forge reads product titles and images only when you choose products for a rule. At checkout, the validation checks cart contents and totals inside Shopify to decide whether a rule is met. It doesn't store customer, cart, or order data.",
  },
  {
    title: "Permissions",
    detail:
      "Cart Forge asks for access to read products (to pick products for rules) and to manage checkout validations (to enforce rules). It requests nothing else.",
  },
  {
    title: "Sessions",
    detail:
      "To keep you signed in, Cart Forge stores a Shopify session for your store. It's deleted when you uninstall the app.",
  },
];

export default function Privacy() {
  return (
    <s-page heading="Privacy summary" inlineSize="small">
      <s-link slot="breadcrumb-actions" href="/app/settings">
        Settings
      </s-link>
      <s-section>
        <s-stack gap="large">
          {ITEMS.map((item) => (
            <s-stack key={item.title} gap="small-200">
              <s-heading>{item.title}</s-heading>
              <s-paragraph>{item.detail}</s-paragraph>
            </s-stack>
          ))}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
