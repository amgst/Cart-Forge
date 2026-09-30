// Shared rule definitions for the admin UI and server. The checkout-side logic lives in
// extensions/cart-rules-validation, which reads the same JSON from the validation's metafield.

export const TEMPLATES = [
  {
    id: "minCartValue",
    title: "Set minimum order value",
    description: "Require customers to spend a minimum amount.",
    icon: "cash-dollar",
  },
  {
    id: "maxCartValue",
    title: "Set maximum order value",
    description: "Keep orders below a specific amount.",
    icon: "cart",
  },
  {
    id: "minProductQuantity",
    title: "Require minimum quantity",
    description: "Set the fewest units customers can buy.",
    icon: "product",
  },
  {
    id: "maxProductQuantity",
    title: "Limit product quantity",
    description: "Set the most units customers can buy.",
    icon: "adjust",
  },
  {
    id: "totalCartQuantity",
    title: "Limit total cart quantity",
    description: "Set a maximum number of items per order.",
    icon: "package",
  },
  {
    id: "requiredProduct",
    title: "Require another product",
    description: "A product can only be bought with another.",
    icon: "collection",
  },
  {
    id: "productCombination",
    title: "Prevent a product combination",
    description: "Keep selected products out of the same order.",
    icon: "disabled",
  },
  {
    id: "custom",
    title: "Create a custom rule",
    description: "Start with a condition and make it your own.",
    icon: "wand",
  },
];

export const CONDITIONS = [
  { id: "subtotal", label: "Cart subtotal" },
  { id: "totalQuantity", label: "Total cart quantity" },
  { id: "productQuantity", label: "Product quantity" },
];

export const COMPARISONS = [
  { id: "lt", label: "is less than" },
  { id: "gt", label: "is greater than" },
  { id: "eq", label: "equals" },
];

const DEFAULTS = {
  minCartValue: ["Minimum order value", 50],
  maxCartValue: ["Maximum order value", 2000],
  minProductQuantity: ["Minimum product quantity", 3],
  maxProductQuantity: ["Maximum product quantity", 2],
  totalCartQuantity: ["Maximum cart quantity", 20],
  requiredProduct: ["Required product", 1],
  productCombination: ["Products cannot be bought together", 1],
  custom: ["Custom cart rule", 1],
};

export const EMPTY_CONFIG = { enabled: true, tone: "friendly", rules: [] };

export function isTemplate(id) {
  return TEMPLATES.some((template) => template.id === id);
}

export function templateTitle(id) {
  return TEMPLATES.find((item) => item.id === id)?.title ?? "Custom rule";
}

export function templateIcon(id) {
  return TEMPLATES.find((item) => item.id === id)?.icon ?? "wand";
}

export function needsTarget(rule) {
  return (
    [
      "minProductQuantity",
      "maxProductQuantity",
      "requiredProduct",
      "productCombination",
    ].includes(rule.template) ||
    (rule.template === "custom" && rule.condition === "productQuantity")
  );
}

export function needsSecondaryTarget(rule) {
  return (
    rule.template === "requiredProduct" ||
    rule.template === "productCombination"
  );
}

export function isMoneyRule(rule) {
  return (
    rule.template === "minCartValue" ||
    rule.template === "maxCartValue" ||
    (rule.template === "custom" && rule.condition === "subtotal")
  );
}

export function formatMoney(amount, currencyCode) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode || "USD",
      maximumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

export function summary(rule, currencyCode) {
  const title = rule.target?.title ?? "Selected product";
  const other = rule.secondaryTarget?.title ?? "another product";
  const money = formatMoney(rule.threshold, currencyCode);
  switch (rule.template) {
    case "minCartValue":
      return `Cart subtotal must be at least ${money}`;
    case "maxCartValue":
      return `Cart subtotal cannot exceed ${money}`;
    case "minProductQuantity":
      return `At least ${rule.threshold} of ${title}`;
    case "maxProductQuantity":
      return `Up to ${rule.threshold} of ${title}`;
    case "totalCartQuantity":
      return `Up to ${rule.threshold} items in the cart`;
    case "requiredProduct":
      return `${title} requires ${other}`;
    case "productCombination":
      return `${title} cannot be bought with ${other}`;
    default: {
      const condition =
        CONDITIONS.find((item) => item.id === rule.condition)?.label ??
        "Cart subtotal";
      const comparison =
        COMPARISONS.find((item) => item.id === rule.comparison)?.label ??
        "is less than";
      const value = isMoneyRule(rule) ? money : rule.threshold;
      return `Blocks checkout when ${condition.toLowerCase()} ${comparison} ${value}`;
    }
  }
}

export function messageFor(rule, currencyCode, tone = "friendly") {
  const title = rule.target?.title ?? "this product";
  const other = rule.secondaryTarget?.title ?? "the required product";
  const money = formatMoney(rule.threshold, currencyCode);
  const count = rule.threshold;
  const friendly = tone !== "neutral";
  switch (rule.template) {
    case "minCartValue":
      return friendly
        ? `Your order subtotal must be at least ${money}.`
        : `Minimum order subtotal: ${money}.`;
    case "maxCartValue":
      return friendly
        ? `Your order subtotal cannot exceed ${money}.`
        : `Maximum order subtotal: ${money}.`;
    case "minProductQuantity":
      return friendly
        ? `Please add at least ${count} ${title} to your order.`
        : `Minimum quantity for ${title}: ${count}.`;
    case "maxProductQuantity":
      return friendly
        ? `You can purchase a maximum of ${count} ${title} per order.`
        : `Maximum quantity for ${title}: ${count}.`;
    case "totalCartQuantity":
      return friendly
        ? `Your order can contain a maximum of ${count} items.`
        : `Maximum items per order: ${count}.`;
    case "requiredProduct":
      return friendly
        ? `Add ${other} to your order to purchase ${title}.`
        : `${title} requires ${other}.`;
    case "productCombination": {
      const first = rule.target?.title ?? "This product";
      const second = rule.secondaryTarget?.title ?? "the other product";
      return friendly
        ? `${first} and ${second} cannot be purchased together.`
        : `${first} and ${second} can't be combined.`;
    }
    default:
      return friendly
        ? "Your cart does not meet the requirements for this order."
        : "Cart requirements not met.";
  }
}

export function makeRule(template, currencyCode, tone) {
  const [name, threshold] = DEFAULTS[template] ?? DEFAULTS.custom;
  const rule = {
    id: "",
    name,
    template,
    status: "inactive",
    threshold,
    target: null,
    secondaryTarget: null,
    condition: template === "custom" ? "subtotal" : null,
    comparison: template === "custom" ? "lt" : null,
    message: "",
    updatedAt: "",
  };
  rule.message = messageFor(rule, currencyCode, tone);
  return rule;
}

/** Returns an error string, or null when the rule can be saved. */
export function validateRule(rule) {
  if (!isTemplate(rule.template)) return "Choose a rule type.";
  if (!rule.name?.trim()) return "Add a rule name.";
  if (!rule.message?.trim()) return "Add a customer message.";
  if (rule.message.length > 180) return "Keep the customer message under 180 characters.";
  if (!(Number(rule.threshold) >= 0)) return "Enter a valid number.";
  if (needsTarget(rule) && !rule.target?.id)
    return "Choose a product to finish this rule.";
  if (needsSecondaryTarget(rule) && !rule.secondaryTarget?.id)
    return "Choose the second product to finish this rule.";
  return null;
}

export function formatUpdated(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? `Today, ${date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}`
    : date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}
