import { useEffect, useState } from "react";
import { redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  loadCartRules,
  newRuleId,
  saveCartRules,
} from "../cart-rules.server";
import {
  COMPARISONS,
  CONDITIONS,
  isMoneyRule,
  isTemplate,
  makeRule,
  messageFor,
  needsSecondaryTarget,
  needsTarget,
  templateTitle,
  validateRule,
} from "../cart-rules";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const { config, currencyCode } = await loadCartRules(admin);

  if (params.id === "create") {
    const template = new URL(request.url).searchParams.get("template");
    if (!isTemplate(template)) throw redirect("/app/rules/new");
    return {
      rule: makeRule(template, currencyCode, config.tone),
      isNew: true,
      currencyCode,
      tone: config.tone,
    };
  }

  const rule = config.rules.find((item) => item.id === params.id);
  if (!rule) throw redirect("/app");
  return { rule, isNew: false, currencyCode, tone: config.tone };
};

export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  let rule;
  try {
    rule = JSON.parse(String(form.get("rule")));
  } catch {
    return { error: "Couldn’t read the rule. Please try again." };
  }

  const error = validateRule(rule);
  if (error) return { error };

  const { config, validationId } = await loadCartRules(admin);
  const isNew = params.id === "create";
  if (!isNew && !config.rules.some((item) => item.id === params.id)) {
    return { error: "That rule no longer exists." };
  }

  const saved = {
    id: isNew ? newRuleId() : params.id,
    name: rule.name.trim(),
    template: rule.template,
    status: rule.status === "active" ? "active" : "inactive",
    threshold: Math.max(0, Number(rule.threshold)),
    target: needsTarget(rule) ? pickTarget(rule.target) : null,
    secondaryTarget: needsSecondaryTarget(rule)
      ? pickTarget(rule.secondaryTarget)
      : null,
    condition: rule.template === "custom" ? rule.condition : null,
    comparison: rule.template === "custom" ? rule.comparison : null,
    message: rule.message.trim(),
    updatedAt: new Date().toISOString(),
  };

  const rules = isNew
    ? [saved, ...config.rules]
    : config.rules.map((item) => (item.id === saved.id ? saved : item));

  await saveCartRules(admin, { ...config, rules }, validationId);
  return { ok: true, isNew };
};

function pickTarget(target) {
  if (!target?.id) return null;
  return {
    id: target.id,
    type: target.type === "ProductVariant" ? "ProductVariant" : "Product",
    title: String(target.title ?? "").slice(0, 120),
    image: target.image ?? null,
  };
}

export default function RuleBuilder() {
  const { rule, isNew, currencyCode, tone } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [draft, setDraft] = useState(rule);
  const [messageEdited, setMessageEdited] = useState(!isNew);
  const saving = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    } else if (fetcher.data.ok) {
      shopify.toast.show(fetcher.data.isNew ? "Rule created" : "Rule updated");
      navigate("/app");
    }
  }, [fetcher.state, fetcher.data, shopify, navigate]);

  const change = (updates) =>
    setDraft((current) => {
      const next = { ...current, ...updates };
      if (!messageEdited && !("message" in updates) && !("name" in updates)) {
        next.message = messageFor(next, currencyCode, tone);
      }
      return next;
    });

  const save = () => {
    const error = validateRule(draft);
    if (error) {
      shopify.toast.show(error, { isError: true });
      return;
    }
    fetcher.submit({ rule: JSON.stringify(draft) }, { method: "POST" });
  };

  const pick = async (field, type) => {
    let selection;
    try {
      selection = await shopify.resourcePicker({
        type,
        action: "select",
        multiple: false,
        ...(type === "product" ? { filter: { variants: false } } : {}),
      });
    } catch (error) {
      shopify.toast.show(`Couldn’t open the product picker: ${error.message}`, {
        isError: true,
      });
      return;
    }
    const item = selection?.[0];
    if (!item) return;
    const target =
      type === "variant"
        ? {
            id: item.id,
            type: "ProductVariant",
            title: item.displayName ?? item.title,
            image: item.image?.originalSrc ?? null,
          }
        : {
            id: item.id,
            type: "Product",
            title: item.title,
            image: item.images?.[0]?.originalSrc ?? null,
          };
    change({ [field]: target });
  };

  const money = isMoneyRule(draft);
  const pair = needsSecondaryTarget(draft);

  const amountField = (label) =>
    money ? (
      <s-money-field
        label={label}
        min={0}
        value={String(draft.threshold)}
        details={`Amount in ${currencyCode}. Converted automatically for customers shopping in other currencies.`}
        onInput={(event) =>
          change({ threshold: Number(event.currentTarget.value) || 0 })
        }
      />
    ) : (
      <s-number-field
        label={label}
        min={1}
        step={1}
        inputMode="numeric"
        suffix="units"
        value={String(draft.threshold)}
        onInput={(event) =>
          change({
            threshold: Math.max(
              1,
              Math.round(Number(event.currentTarget.value) || 1),
            ),
          })
        }
      />
    );

  const targetField = (label, field, placeholder) => {
    const selected = draft[field];
    return (
      <s-stack gap="small-200">
        <s-text type="strong">{label}</s-text>
        <s-clickable
          padding="small"
          border="base"
          borderRadius="base"
          accessibilityLabel={`${label}: ${selected?.title ?? placeholder}`}
          onClick={() => pick(field, "product")}
        >
          <s-grid
            gridTemplateColumns="auto 1fr auto"
            gap="base"
            alignItems="center"
          >
            {selected?.image ? (
              <s-thumbnail src={selected.image} alt="" size="small" />
            ) : (
              <s-icon type="product" />
            )}
            <s-stack gap="small-500">
              <s-text>{selected?.title ?? placeholder}</s-text>
              {selected && (
                <s-text color="subdued">
                  {selected.type === "ProductVariant"
                    ? "Specific variant"
                    : "All variants"}
                </s-text>
              )}
            </s-stack>
            <s-text color="subdued">{selected ? "Change" : "Browse"}</s-text>
          </s-grid>
        </s-clickable>
        <s-stack direction="inline">
          <s-button variant="tertiary" onClick={() => pick(field, "variant")}>
            Choose a specific variant instead
          </s-button>
        </s-stack>
      </s-stack>
    );
  };

  return (
    <s-page heading={isNew ? "Create a rule" : "Edit rule"}>
      <s-link slot="breadcrumb-actions" href="/app">
        Cart Rules
      </s-link>
      <s-button
        slot="primary-action"
        variant="primary"
        loading={saving}
        onClick={save}
      >
        {isNew ? "Save rule" : "Save changes"}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => navigate("/app")}>
        Cancel
      </s-button>

      <s-section heading="Rule name">
        <s-stack gap="base">
          <s-text-field
            label="Name"
            details="Only you can see this name."
            placeholder="e.g. Maximum 3 gift boxes"
            maxLength={80}
            value={draft.name}
            onInput={(event) => change({ name: event.currentTarget.value })}
          />
          <s-stack direction="inline" gap="small" alignItems="center">
            <s-badge>{templateTitle(draft.template)}</s-badge>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section heading="When">
        <s-stack gap="base">
          <s-paragraph color="subdued">
            Choose what needs to happen in the cart.
          </s-paragraph>

          {(draft.template === "minCartValue" ||
            draft.template === "maxCartValue") &&
            amountField(
              draft.template === "minCartValue"
                ? "Block checkout when cart subtotal is less than"
                : "Block checkout when cart subtotal is greater than",
            )}

          {(draft.template === "minProductQuantity" ||
            draft.template === "maxProductQuantity") && (
            <>
              {targetField("Product", "target", "Select a product")}
              {amountField(
                draft.template === "minProductQuantity"
                  ? "Minimum quantity"
                  : "Maximum quantity",
              )}
            </>
          )}

          {draft.template === "totalCartQuantity" &&
            amountField("Block checkout when total cart quantity is greater than")}

          {pair && (
            <>
              {targetField(
                draft.template === "requiredProduct"
                  ? "When this product is in the cart"
                  : "First product",
                "target",
                "Select a product",
              )}
              {targetField(
                draft.template === "requiredProduct"
                  ? "Require this product"
                  : "Cannot be purchased with",
                "secondaryTarget",
                "Select another product",
              )}
            </>
          )}

          {draft.template === "custom" && (
            <>
              <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                <s-select
                  label="Condition"
                  value={draft.condition ?? "subtotal"}
                  onChange={(event) =>
                    change({ condition: event.currentTarget.value })
                  }
                >
                  {CONDITIONS.map((item) => (
                    <s-option key={item.id} value={item.id}>
                      {item.label}
                    </s-option>
                  ))}
                </s-select>
                <s-select
                  label="Comparison"
                  value={draft.comparison ?? "lt"}
                  onChange={(event) =>
                    change({ comparison: event.currentTarget.value })
                  }
                >
                  {COMPARISONS.map((item) => (
                    <s-option key={item.id} value={item.id}>
                      {item.label}
                    </s-option>
                  ))}
                </s-select>
              </s-grid>
              {draft.condition === "productQuantity" &&
                targetField("Product", "target", "Select a product")}
              {amountField("Value")}
            </>
          )}
        </s-stack>
      </s-section>

      <s-section heading="Then">
        <s-grid gridTemplateColumns="auto 1fr" gap="base" alignItems="center">
          <s-icon type="lock" />
          <s-stack gap="small-500">
            <s-text type="strong">Block checkout</s-text>
            <s-text color="subdued">
              Customers won’t be able to place the order.
            </s-text>
          </s-stack>
        </s-grid>
      </s-section>

      <s-section heading="Customer message">
        <s-text-area
          label="Message"
          rows={3}
          maxLength={180}
          details={`Shown in the cart and checkout when this rule is not met. ${draft.message.length}/180`}
          value={draft.message}
          onInput={(event) => {
            setMessageEdited(true);
            change({ message: event.currentTarget.value });
          }}
        />
      </s-section>

      <s-section heading="Status">
        <s-switch
          label="Rule is active"
          details={
            draft.status === "active"
              ? "This rule applies at checkout once saved."
              : "Saved as a draft. It won’t apply until you turn it on."
          }
          checked={draft.status === "active"}
          onChange={(event) =>
            change({
              status: event.currentTarget.checked ? "active" : "inactive",
            })
          }
        />
      </s-section>

      <s-section slot="aside" heading="Customer preview">
        <s-stack gap="base">
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack gap="small">
              <s-text type="strong">Your cart</s-text>
              <s-grid gridTemplateColumns="auto 1fr" gap="small" alignItems="center">
                {draft.target?.image ? (
                  <s-thumbnail src={draft.target.image} alt="" size="small" />
                ) : (
                  <s-icon type="product" />
                )}
                <s-text>{draft.target?.title ?? "Everyday essentials"}</s-text>
              </s-grid>
            </s-stack>
          </s-box>
          <s-banner tone="critical" heading="One small change">
            {draft.message || "Your customer message will appear here."}
          </s-banner>
          <s-paragraph color="subdued">
            Friendly, specific messages help customers fix their cart and keep
            shopping.
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
