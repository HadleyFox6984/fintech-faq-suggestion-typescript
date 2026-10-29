import test from "node:test";
import assert from "node:assert/strict";
import { decideFaqAction } from "./faq_decision.ts";

test("high-risk payment sends a FAQ answer to review", () => {
  const result = decideFaqAction(
    { paymentId: "pay_123", amountCents: 2500, currency: "USD", country: "US", riskScore: 82 },
    "Why is my payment pending?", "A review can keep a payment pending for a short period."
  );
  assert.equal(result.action, "ask_for_review");
  assert.equal(result.audit, "pay_123: review requested");
});
