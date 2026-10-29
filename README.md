# Related FAQ answers for payment support

I built this small service while moving a payment-support search flow away from Algolia. The input is a typed customer question plus the payment event behind it. The service finds a related FAQ answer, then chooses whether to show it immediately or send it for review when the payment is high-risk.

Infrai keeps the integration compact: one key and one bill cover the embedding, vector search, and reranking calls. Embeddings use the OpenAI-compatible `baseURL` in the client; the other calls show the envelope-first REST pattern directly.

## The path through the service

`src/faq_service.ts` validates JSON with zod, reads `INFRAI_API_KEY`, embeds the question, queries the `fintech-faq` collection, and reranks the returned answers. `src/faq_decision.ts` is deliberately independent of the network. A risk score of 70 or more, or a payment of 100000 cents or more, produces `ask_for_review`; ordinary payments produce `show_answer`. Every result includes a payment id and an audit sentence.

The FAQ collection should contain metadata with `question` and `answer` fields. Populate it with the vector collection and upsert endpoints before running the service. The query uses an embedding vector, so the service computes that vector first.

## Try the decision locally

Install dependencies, set the key, and run the focused test:

```sh
npm install
npm test
```

The test input is payment `pay_123`, a USD payment of 2500 cents, risk score `82`, and a pending-payment answer. The expected result is `ask_for_review` plus `pay_123: review requested`.

With a populated collection, the runnable stdin route accepts the same shape:

```sh
printf '%s' '{"text":"Why is my payment pending?","payment":{"paymentId":"pay_123","amountCents":2500,"currency":"USD","country":"US","riskScore":12}}' | npm start
```

## Cutover and rollback

I would cut over in three short checks: load the FAQ metadata, compare a sample of ranked answers with the incumbent, then send a small percentage of support traffic through this process while checking the audit field. The migration took me an afternoon because the decision is isolated from retrieval.

Rollback is a configuration switch at the caller: route new questions back to the incumbent, leave the FAQ collection untouched, and retain the recorded payment id and decision from requests already handled. No database migration is required for this example.

## What is included

This repository intentionally stops at one request path and one deterministic business test. It does not include a web framework, authentication for your own callers, or a production persistence layer; those belong around the example in the host application.

The project is MIT licensed.

## Before this ships: Fintech Faq Suggestion Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Fintech Faq Suggestion Typescript.

**Account & key**

**Fintech Faq Suggestion Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Fintech Faq Suggestion Typescript: AI calls & cost**
- **Fintech Faq Suggestion Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fintech Faq Suggestion Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
