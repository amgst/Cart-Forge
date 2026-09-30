import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  loadCartRules,
  newRuleId,
  saveCartRules,
} from "../cart-rules.server";
import { formatUpdated, summary, templateTitle } from "../cart-rules";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return loadCartRules(admin);
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const id = form.get("id");
  const { config, validationId } = await loadCartRules(admin);
  const rule = config.rules.find((item) => item.id === id);
  if (!rule) return { error: "That rule no longer exists." };

  const now = new Date().toISOString();
  let rules = config.rules;
  let toast = "";

  if (intent === "toggle") {
    const status = rule.status === "active" ? "inactive" : "active";
    rules = rules.map((item) =>
      item.id === id ? { ...item, status, updatedAt: now } : item,
    );
    toast = status === "active" ? "Rule activated" : "Rule disabled";
  } else if (intent === "duplicate") {
    rules = [
      {
        ...rule,
        id: newRuleId(),
        name: `${rule.name} (copy)`,
        status: "inactive",
        updatedAt: now,
      },
      ...rules,
    ];
    toast = "Rule duplicated as a draft";
  } else if (intent === "delete") {
    rules = rules.filter((item) => item.id !== id);
    toast = "Rule deleted";
  } else {
    return { error: "Unknown action." };
  }

  await saveCartRules(admin, { ...config, rules }, validationId);
  return { toast };
};

const FILTERS = [
  ["all", "All"],
  ["active", "Active"],
  ["inactive", "Drafts"],
];

export default function CartRules() {
  const { config, currencyCode, validationId, validationEnabled } =
    useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.toast) shopify.toast.show(fetcher.data.toast);
    if (fetcher.data.error)
      shopify.toast.show(fetcher.data.error, { isError: true });
  }, [fetcher.state, fetcher.data, shopify]);

  const rules = config.rules;
  const counts = {
    all: rules.length,
    active: rules.filter((rule) => rule.status === "active").length,
    inactive: rules.filter((rule) => rule.status !== "active").length,
  };
  const shownRules = rules.filter(
    (rule) =>
      (filter === "all" || rule.status === filter) &&
      `${rule.name} ${summary(rule, currencyCode)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  const submit = (intent, id) =>
    fetcher.submit({ intent, id }, { method: "POST" });

  return (
    <s-page heading="Cart Rules">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/app/rules/new")}
      >
        Create rule
      </s-button>
      <s-button
        slot="secondary-actions"
        onClick={() => navigate("/app/settings")}
      >
        Settings
      </s-button>

      {!config.enabled && (
        <s-banner tone="warning" heading="Cart Forge is turned off">
          Rules are saved but won’t be applied at checkout.{" "}
          <s-link href="/app/settings">Review settings</s-link>
        </s-banner>
      )}
      {validationId && !validationEnabled && (
        <s-banner tone="warning" heading="Checkout validation is off">
          The Cart Forge validation is turned off in your store’s checkout
          settings, so rules won’t block checkout.{" "}
          <s-link href="shopify://admin/settings/checkout" target="_top">
            Open checkout settings
          </s-link>
        </s-banner>
      )}

      {rules.length === 0 ? (
        <s-section accessibilityLabel="No cart rules">
          <s-stack gap="base" alignItems="center" padding="large">
            <s-icon type="cart" />
            <s-heading>No cart rules yet</s-heading>
            <s-paragraph color="subdued">
              Create your first rule to control quantities, order values, or
              product combinations.
            </s-paragraph>
            <s-button
              variant="primary"
              onClick={() => navigate("/app/rules/new")}
            >
              Create rule
            </s-button>
          </s-stack>
        </s-section>
      ) : (
        <s-section padding="none" accessibilityLabel="Cart rules">
          <s-table>
            <s-grid
              slot="filters"
              gridTemplateColumns="auto 1fr"
              gap="base"
              alignItems="center"
            >
              <s-button-group>
                {FILTERS.map(([value, label]) => (
                  <s-button
                    key={value}
                    variant={filter === value ? "primary" : "secondary"}
                    onClick={() => setFilter(value)}
                  >
                    {label} ({counts[value]})
                  </s-button>
                ))}
              </s-button-group>
              <s-search-field
                label="Search rules"
                labelAccessibilityVisibility="exclusive"
                placeholder="Search rules"
                value={query}
                onInput={(event) => setQuery(event.currentTarget.value)}
              />
            </s-grid>
            <s-table-header-row>
              <s-table-header listSlot="primary">Rule</s-table-header>
              <s-table-header>Type</s-table-header>
              <s-table-header listSlot="inline">Status</s-table-header>
              <s-table-header>Last updated</s-table-header>
              <s-table-header>
                <s-text accessibilityVisibility="exclusive">Actions</s-text>
              </s-table-header>
            </s-table-header-row>
            <s-table-body>
              {shownRules.map((rule) => (
                <s-table-row key={rule.id}>
                  <s-table-cell>
                    <s-stack gap="small-500">
                      <s-link href={`/app/rules/${rule.id}`}>
                        {rule.name}
                      </s-link>
                      <s-text color="subdued">
                        {summary(rule, currencyCode)}
                      </s-text>
                    </s-stack>
                  </s-table-cell>
                  <s-table-cell>{templateTitle(rule.template)}</s-table-cell>
                  <s-table-cell>
                    <s-badge
                      tone={rule.status === "active" ? "success" : "neutral"}
                    >
                      {rule.status === "active" ? "Active" : "Draft"}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>{formatUpdated(rule.updatedAt)}</s-table-cell>
                  <s-table-cell>
                    <s-button
                      variant="tertiary"
                      icon="menu-horizontal"
                      accessibilityLabel={`Actions for ${rule.name}`}
                      commandFor={`menu-${rule.id}`}
                    />
                    <s-menu
                      id={`menu-${rule.id}`}
                      accessibilityLabel={`Actions for ${rule.name}`}
                    >
                      <s-button
                        icon="edit"
                        onClick={() => navigate(`/app/rules/${rule.id}`)}
                      >
                        Edit
                      </s-button>
                      <s-button
                        icon="duplicate"
                        onClick={() => submit("duplicate", rule.id)}
                      >
                        Duplicate
                      </s-button>
                      <s-button
                        icon={rule.status === "active" ? "disabled" : "check"}
                        onClick={() => submit("toggle", rule.id)}
                      >
                        {rule.status === "active" ? "Disable" : "Activate"}
                      </s-button>
                      <s-button
                        icon="delete"
                        tone="critical"
                        commandFor="delete-modal"
                        command="--show"
                        onClick={() => setDeleting(rule)}
                      >
                        Delete
                      </s-button>
                    </s-menu>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
          {shownRules.length === 0 && (
            <s-box padding="base">
              <s-stack gap="small" alignItems="center">
                <s-text type="strong">No matching rules</s-text>
                <s-text color="subdued">
                  Try another search or switch to a different status.
                </s-text>
                <s-button
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </s-button>
              </s-stack>
            </s-box>
          )}
        </s-section>
      )}

      <s-section slot="aside" heading="How rules work">
        <s-paragraph>
          Active rules are checked in the cart and at checkout. When a rule
          isn’t met, customers see your message and can’t place the order
          until they fix their cart.
        </s-paragraph>
        <s-paragraph color="subdued">
          Every new rule starts as a draft. Turn it on when it’s ready.
        </s-paragraph>
      </s-section>

      <s-modal id="delete-modal" heading="Delete this rule?">
        <s-paragraph>
          <s-text type="strong">{deleting?.name}</s-text> will be permanently
          removed and will stop applying at checkout.
        </s-paragraph>
        <s-button slot="secondary-actions" commandFor="delete-modal" command="--hide">
          Keep rule
        </s-button>
        <s-button
          slot="primary-action"
          variant="primary"
          tone="critical"
          commandFor="delete-modal"
          command="--hide"
          onClick={() => deleting && submit("delete", deleting.id)}
        >
          Delete rule
        </s-button>
      </s-modal>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
