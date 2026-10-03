import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { redirect } from "react-router";
import { login } from "../../shopify.server";

export const loader = async ({ request }) => {
  if (new URL(request.url).searchParams.has("shop")) await login(request);
  return null;
};

export const action = async () => redirect("/auth/login");

export default function Auth() {
  return (
    <AppProvider embedded={false}>
      <s-page heading="Open Cart Forge in Shopify">
        <s-section>
          <s-paragraph>
            Open Cart Forge from the Apps section in your Shopify admin. To
            install the app, use its Shopify App Store listing.
          </s-paragraph>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
