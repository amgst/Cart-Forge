import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query cartForgeHome {
        shop {
          name
          myshopifyDomain
        }
        productsCount {
          count
        }
      }`,
  );
  const { data } = await response.json();

  return {
    shopName: data?.shop?.name ?? "",
    shopDomain: data?.shop?.myshopifyDomain ?? "",
    productsCount: data?.productsCount?.count ?? 0,
  };
};

export default function Index() {
  const { shopName, shopDomain, productsCount } = useLoaderData();
  const storeHandle = shopDomain.replace(".myshopify.com", "");

  return (
    <s-page heading="Cart Forge">
      <s-section heading={`Welcome${shopName ? `, ${shopName}` : ""}`}>
        <s-paragraph>
          Cart Forge helps you build stronger cart experiences for your store.
          Follow the steps below to get set up.
        </s-paragraph>
      </s-section>

      <s-section heading="Get started">
        <s-ordered-list>
          <s-list-item>
            Review the products you want to feature in your cart.
          </s-list-item>
          <s-list-item>
            Enable the Cart Forge app embed in your theme editor.
          </s-list-item>
          <s-list-item>
            Preview your storefront cart and publish your changes.
          </s-list-item>
        </s-ordered-list>
        <s-stack direction="inline" gap="base">
          <s-button
            href={`https://admin.shopify.com/store/${storeHandle}/themes/current/editor?context=apps`}
            target="_blank"
          >
            Open theme editor
          </s-button>
          <s-button
            variant="tertiary"
            href={`https://admin.shopify.com/store/${storeHandle}/products`}
            target="_blank"
          >
            View products
          </s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Store overview">
        <s-paragraph>
          <s-text>Store: </s-text>
          <s-text>{shopDomain}</s-text>
        </s-paragraph>
        <s-paragraph>
          <s-text>Products: </s-text>
          <s-text>{productsCount}</s-text>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
