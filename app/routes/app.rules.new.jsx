import { useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { TEMPLATES } from "../cart-rules";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function NewRule() {
  const navigate = useNavigate();

  return (
    <s-page heading="What would you like to do?" inlineSize="small">
      <s-link slot="breadcrumb-actions" href="/app">
        Cart Rules
      </s-link>
      <s-section>
        <s-stack gap="small">
          <s-paragraph color="subdued">
            Choose a starting point. You can adjust the details next.
          </s-paragraph>
          {TEMPLATES.map((template) => (
            <s-clickable
              key={template.id}
              padding="base"
              border="base"
              borderRadius="base"
              accessibilityLabel={template.title}
              onClick={() =>
                navigate(`/app/rules/create?template=${template.id}`)
              }
            >
              <s-grid
                gridTemplateColumns="auto 1fr auto"
                gap="base"
                alignItems="center"
              >
                <s-icon type={template.icon} />
                <s-stack gap="small-500">
                  <s-text type="strong">{template.title}</s-text>
                  <s-text color="subdued">{template.description}</s-text>
                </s-stack>
                <s-icon type="chevron-right" color="subdued" />
              </s-grid>
            </s-clickable>
          ))}
        </s-stack>
      </s-section>
      <s-paragraph color="subdued">
        Every rule starts as a draft. You can turn it on when it’s ready.
      </s-paragraph>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
