import { EMPTY_CONFIG } from "./cart-rules";

// Rules are stored as JSON on the Cart Forge validation itself, so the checkout Function
// (extensions/cart-rules-validation) reads them straight from its input query.
const FUNCTION_HANDLE = "cart-rules-validation";
const METAFIELD = { namespace: "$app", key: "cart_rules" };

async function graphql(admin, query, variables) {
  const response = await admin.graphql(query, { variables });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join(", "));
  }
  return json.data;
}

export async function loadCartRules(admin) {
  const data = await graphql(
    admin,
    `#graphql
      query cartForgeValidation {
        validations(first: 25) {
          nodes {
            id
            enabled
            shopifyFunction {
              handle
            }
            metafield(namespace: "$app", key: "cart_rules") {
              jsonValue
            }
          }
        }
        shop {
          currencyCode
          myshopifyDomain
        }
      }`,
  );

  const validation = data.validations.nodes.find(
    (node) => node.shopifyFunction?.handle === FUNCTION_HANDLE,
  );
  const saved = validation?.metafield?.jsonValue;

  return {
    validationId: validation?.id ?? null,
    validationEnabled: validation?.enabled ?? false,
    currencyCode: data.shop.currencyCode,
    shopDomain: data.shop.myshopifyDomain,
    config: {
      ...EMPTY_CONFIG,
      ...(saved && typeof saved === "object" ? saved : {}),
      rules: Array.isArray(saved?.rules) ? saved.rules : [],
    },
  };
}

async function createValidation(admin) {
  const data = await graphql(
    admin,
    `#graphql
      mutation cartForgeValidationCreate($validation: ValidationCreateInput!) {
        validationCreate(validation: $validation) {
          validation {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      validation: {
        functionHandle: FUNCTION_HANDLE,
        title: "Cart Forge rules",
        enable: true,
        blockOnFailure: false,
      },
    },
  );
  const { validation, userErrors } = data.validationCreate;
  if (userErrors.length) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }
  return validation.id;
}

/** Saves the full config, creating the checkout validation on first save. */
export async function saveCartRules(admin, config, validationId) {
  const ownerId = validationId ?? (await createValidation(admin));
  const data = await graphql(
    admin,
    `#graphql
      mutation cartForgeSaveRules($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      metafields: [
        {
          ownerId,
          namespace: METAFIELD.namespace,
          key: METAFIELD.key,
          type: "json",
          value: JSON.stringify(config),
        },
      ],
    },
  );
  const { userErrors } = data.metafieldsSet;
  if (userErrors.length) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }
  return ownerId;
}

export function newRuleId() {
  return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
