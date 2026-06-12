export type FaqItem = { q: string; a: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "I validated my JSON-LD with Google's Rich Results Test and it passed. Why am I still not cited?",
    a: "Validation confirms the markup is parseable — it does not affect retrieval. Schema labels what a page is; it does not raise Bing rank, earn third-party mentions, or make your answer any more extractable. Those are separate work items.",
  },
  {
    q: "Does FAQPage schema help answer engines surface my content?",
    a: "FAQPage schema tells a crawler that a page contains question-and-answer pairs in a structured format. It is parse hygiene. The same page, without Bing indexing and without brand mentions on authoritative sources, will not be cited more often because schema was added.",
  },
  {
    q: "My page renders in a JavaScript framework. Will adding JSON-LD in the <head> fix that?",
    a: "No. JSON-LD in the document head is readable by crawlers — but if your answer text is injected by JavaScript after page load, the passage itself is invisible to most crawl snapshots. Schema in the head cannot expose content that is not in the server-rendered HTML.",
  },
  {
    q: "How long after fixing the real levers should I expect to see citation changes?",
    a: "There is no guaranteed timeline. Bing rank changes are typically visible within weeks of indexing. Citation changes in weight-based models such as ChatGPT may take months as model snapshots update. We measure delta, not ETA.",
  },
];
