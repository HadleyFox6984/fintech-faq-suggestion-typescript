import { z } from "zod";
import { decideFaqAction, type PaymentEvent } from "./faq_decision.ts";
import { InfraiClient } from "./infrai_client.ts";

const requestSchema = z.object({
  text: z.string().min(2),
  payment: z.object({
    paymentId: z.string().min(1), amountCents: z.number().int().nonnegative(),
    currency: z.string().length(3), country: z.string().length(2), riskScore: z.number().min(0).max(100)
  })
});

export async function suggestFaq(body: unknown) {
  const input = requestSchema.parse(body);
  const client = new InfraiClient(process.env.INFRAI_API_KEY ?? "");
  const embedding = await client.embeddings(input.text);
  const matches = await client.request<{ vectors: Array<{ metadata: { question: string; answer: string } }> }>(
    "/v1/vector/query", { collection: "fintech-faq", embedding, top_k: 5, filter: {}, include_metadata: true }
  );
  const candidates = matches.vectors.map((item) => item.metadata.answer);
  const ranked = await client.request<{ results: Array<{ index: number }> }>(
    "/v1/ai/rerank", { query: input.text, candidates, top_k: 1, model: "auto", vendor: "cohere" }
  );
  const selected = matches.vectors[ranked.results[0]?.index ?? 0]?.metadata;
  if (!selected) throw new Error("No FAQ match");
  return decideFaqAction(input.payment as PaymentEvent, selected.question, selected.answer);
}

if (process.argv[1]?.endsWith("faq_service.ts")) {
  process.stdin.setEncoding("utf8");
  let raw = "";
  process.stdin.on("data", (chunk) => { raw += chunk; });
  process.stdin.on("end", async () => console.log(JSON.stringify(await suggestFaq(JSON.parse(raw)))));
}
