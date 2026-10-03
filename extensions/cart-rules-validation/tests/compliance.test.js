import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  webhook: vi.fn(),
  findSessionsByShop: vi.fn(),
  deleteSessions: vi.fn(),
}));

vi.mock("../../../app/shopify.server", () => ({
  authenticate: { webhook: mocks.webhook },
  sessionStorage: mocks,
}));

import { action } from "../../../app/routes/webhooks.compliance.jsx";

beforeEach(() => vi.resetAllMocks());

test("shop redaction deletes remaining sessions even after uninstall", async () => {
  mocks.webhook.mockResolvedValue({ topic: "SHOP_REDACT", shop: "test.myshopify.com" });
  mocks.findSessionsByShop.mockResolvedValue([{ id: "offline_test" }, { id: "online_test" }]);
  const response = await action({ request: new Request("https://example.com/webhooks/compliance", { method: "POST" }) });
  expect(mocks.findSessionsByShop).toHaveBeenCalledWith("test.myshopify.com");
  expect(mocks.deleteSessions).toHaveBeenCalledWith(["offline_test", "online_test"]);
  expect(response.status).toBe(200);
});

test.each(["CUSTOMERS_DATA_REQUEST", "CUSTOMERS_REDACT"])("acknowledges %s without storing buyer data", async (topic) => {
  mocks.webhook.mockResolvedValue({ topic, shop: "test.myshopify.com" });
  const response = await action({ request: new Request("https://example.com/webhooks/compliance", { method: "POST" }) });
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("");
  expect(mocks.deleteSessions).not.toHaveBeenCalled();
});

test("authentication rejection propagates before any deletion", async () => {
  const rejection = new Response(null, { status: 401 });
  mocks.webhook.mockRejectedValue(rejection);
  await expect(action({ request: new Request("https://example.com/webhooks/compliance", { method: "POST" }) })).rejects.toBe(rejection);
  expect(mocks.findSessionsByShop).not.toHaveBeenCalled();
  expect(mocks.deleteSessions).not.toHaveBeenCalled();
});
