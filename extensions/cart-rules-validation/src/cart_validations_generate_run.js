// @ts-check

/**
 * @typedef {import("../generated/api").CartValidationsGenerateRunInput} CartValidationsGenerateRunInput
 * @typedef {import("../generated/api").CartValidationsGenerateRunResult} CartValidationsGenerateRunResult
 */

/**
 * Rules are saved by the admin app as JSON in the validation's `$app.cart_rules` metafield:
 * { enabled: boolean, rules: Rule[] }. Amounts are in the shop's currency.
 *
 * @typedef {{ id: string, type: "Product" | "ProductVariant" }} Target
 * @typedef {{
 *   status: "active" | "inactive",
 *   template: string,
 *   threshold: number,
 *   target?: Target | null,
 *   secondaryTarget?: Target | null,
 *   condition?: "subtotal" | "totalQuantity" | "productQuantity",
 *   comparison?: "lt" | "gt" | "eq",
 *   message: string,
 * }} Rule
 */

/**
 * @param {CartValidationsGenerateRunInput} input
 * @returns {CartValidationsGenerateRunResult}
 */
export function cartValidationsGenerateRun(input) {
  const config = /** @type {{ enabled?: boolean, rules?: Rule[] } | null} */ (
    input.validation.metafield?.jsonValue ?? null
  );
  const lines = input.cart.lines;

  if (!config || config.enabled === false || lines.length === 0) {
    return { operations: [{ validationAdd: { errors: [] } }] };
  }

  const rate = Number(input.presentmentCurrencyRate) || 1;
  const subtotal = Number(input.cart.cost.subtotalAmount.amount);
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  /** @param {Target | null | undefined} target */
  const quantityOf = (target) => {
    if (!target) return 0;
    return lines.reduce((sum, line) => {
      const merchandise = line.merchandise;
      if (merchandise.__typename !== "ProductVariant") return sum;
      const id =
        target.type === "ProductVariant"
          ? merchandise.id
          : merchandise.product.id;
      return id === target.id ? sum + line.quantity : sum;
    }, 0);
  };

  /** @param {Rule} rule */
  const isBroken = (rule) => {
    const threshold = Number(rule.threshold);
    const money = threshold * rate;
    switch (rule.template) {
      case "minCartValue":
        return subtotal < money;
      case "maxCartValue":
        return subtotal > money;
      case "minProductQuantity": {
        const quantity = quantityOf(rule.target);
        return quantity > 0 && quantity < threshold;
      }
      case "maxProductQuantity":
        return quantityOf(rule.target) > threshold;
      case "totalCartQuantity":
        return totalQuantity > threshold;
      case "requiredProduct":
        return (
          quantityOf(rule.target) > 0 && quantityOf(rule.secondaryTarget) === 0
        );
      case "productCombination":
        return (
          quantityOf(rule.target) > 0 && quantityOf(rule.secondaryTarget) > 0
        );
      case "custom": {
        let value;
        let limit = threshold;
        if (rule.condition === "subtotal") {
          value = subtotal;
          limit = money;
        } else if (rule.condition === "productQuantity") {
          value = quantityOf(rule.target);
          if (value === 0) return false;
        } else {
          value = totalQuantity;
        }
        if (rule.comparison === "gt") return value > limit;
        if (rule.comparison === "eq") return value === limit;
        return value < limit;
      }
      default:
        return false;
    }
  };

  const messages = new Set();
  for (const rule of config.rules ?? []) {
    if (rule.status === "active" && isBroken(rule)) messages.add(rule.message);
  }

  const errors = [...messages].map((message) => ({
    message,
    target: "$.cart",
  }));

  return { operations: [{ validationAdd: { errors } }] };
}
