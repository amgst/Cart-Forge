import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { loadCartRules, saveCartRules } from "../cart-rules.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { config, validationId, validationEnabled } =
    await loadCartRules(admin);
  return {
    enabled: config.enabled,
    tone: config.tone,
    validationId,
    validationEnabled,
  };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const { config, validationId } = await loadCartRules(admin);
  const next = { ...config };

  if (form.has("enabled")) next.enabled = form.get("enabled") === "true";
  if (form.has("tone"))
    next.tone = form.get("tone") === "neutral" ? "neutral" : "friendly";

  await saveCartRules(admin, next, validationId);
  return {
    toast: form.has("enabled")
      ? next.enabled
        ? "Cart Forge turned on"
        : "Cart Forge turned off"
      : "Settings saved",
  };
};

export default function Settings() {
  const { enabled, tone, validationId, validationEnabled } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.toast) {
      shopify.toast.show(fetcher.data.toast);
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const pendingEnabled = fetcher.formData?.has("enabled")
    ? fetcher.formData.get("enabled") === "true"
    : enabled;

  return (
    <s-page heading="Settings" inlineSize="small">
      <s-link slot="breadcrumb-actions" href="/app">
        Cart Rules
      </s-link>

      <s-section heading="App status">
        <s-switch
          label="Enable Cart Forge"
          details={
            pendingEnabled
              ? "Active rules are applied in the cart and at checkout."
              : "All rules are paused. Their individual status is kept."
          }
          checked={pendingEnabled}
          onChange={(event) =>
            fetcher.submit(
              { enabled: String(event.currentTarget.checked) },
              { method: "POST" },
            )
          }
        />
        {validationId && !validationEnabled && (
          <s-banner tone="warning" heading="Checkout validation is off">
            The Cart Forge validation is turned off in your store’s checkout
            settings.{" "}
            <s-link href="shopify://admin/settings/checkout" target="_top">
              Open checkout settings
            </s-link>
          </s-banner>
        )}
      </s-section>

      <s-section heading="Customer messages">
        <s-select
          label="Message tone"
          details="Used when suggesting messages for new rules."
          value={tone}
          onChange={(event) =>
            fetcher.submit(
              { tone: event.currentTarget.value },
              { method: "POST" },
            )
          }
        >
          <s-option value="friendly">Friendly and direct</s-option>
          <s-option value="neutral">Short and neutral</s-option>
        </s-select>
      </s-section>

      <s-section heading="Privacy">
        <s-paragraph>
          See what Cart Forge stores and what it can access.{" "}
          <s-link href="/app/privacy">Privacy summary</s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
