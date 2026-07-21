export const QUESTIONS = [
  { key: "irrational_belief", text: "The most irrational thing I believe" },
  { key: "at_2am", text: "What I'm actually like at 2am" },
  { key: "worst_quality", text: "My worst quality I've made peace with" },
  {
    key: "changed_mind",
    text: "The last thing I completely changed my mind about",
  },
  { key: "nothing_to_lose", text: "What I'd do if I had nothing to lose" },
  { key: "care_too_much", text: "Something I care about more than I should" },
  {
    key: "people_get_wrong",
    text: "The thing people always get wrong about me",
  },
  { key: "controversial_take", text: "My controversial take I'll defend" },
  { key: "real_self", text: "What I'm really like when I'm comfortable" },
  {
    key: "never_admit",
    text: "The thing I'd never admit on a first date",
  },
] as const;

export type QuestionKey = (typeof QUESTIONS)[number]["key"];

export function questionText(key: string): string {
  return QUESTIONS.find((q) => q.key === key)?.text ?? "";
}

export const MAX_ANSWER_LENGTH = 200;
export const MIN_PROMPTS = 2;
export const MAX_PROMPTS = 3;
