export type PaymentEvent = {
  paymentId: string;
  amountCents: number;
  currency: string;
  country: string;
  riskScore: number;
};

export type FaqSuggestion = {
  question: string;
  answer: string;
  action: "show_answer" | "ask_for_review";
  audit: string;
};

export function decideFaqAction(event: PaymentEvent, question: string, answer: string): FaqSuggestion {
  const sensitive = event.riskScore >= 70 || event.amountCents >= 100000;
  return {
    question,
    answer,
    action: sensitive ? "ask_for_review" : "show_answer",
    audit: `${event.paymentId}: ${sensitive ? "review requested" : "answer shown"}`
  };
}
