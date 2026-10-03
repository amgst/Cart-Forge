import { authenticate, sessionStorage } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop } = await authenticate.webhook(request);

  if (topic === "SHOP_REDACT") {
    const sessions = await sessionStorage.findSessionsByShop(shop);
    await sessionStorage.deleteSessions(sessions.map(({ id }) => id));
  } else if (topic !== "CUSTOMERS_DATA_REQUEST" && topic !== "CUSTOMERS_REDACT") {
    return new Response(null, { status: 404 });
  }

  // No buyer/customer records are stored by this app. Authentication validates
  // the HMAC before acknowledging any request, including after uninstall.
  return new Response(null, { status: 200 });
};
