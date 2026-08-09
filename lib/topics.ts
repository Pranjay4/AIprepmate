import type { Difficulty, TopicCategory } from "./schema";

export interface TopicSeed {
  topic: string;
  context: string;
  difficulty: Difficulty;
}

// Curated fallback/seed bank — used when live topic generation is unavailable
// and to give the AI topic-generator concrete examples of house style.
export const TOPIC_BANK: Record<Exclude<TopicCategory, "custom">, TopicSeed[]> = {
  "current-affairs": [
    { topic: "Should India cap the number of unicorn startups that IPO without profitability?", context: "Several loss-making Indian startups have listed publicly in the last two years, with mixed results for retail investors.", difficulty: "placement" },
    { topic: "Is coalition politics good for India's long-term economic policy?", context: "Recent elections have produced coalition governments after a decade of single-party majorities.", difficulty: "elite" },
    { topic: "Should social media platforms be held liable for AI-generated misinformation during elections?", context: "Deepfake political content has surfaced in multiple recent elections worldwide.", difficulty: "intermediate" },
  ],
  technology: [
    { topic: "Will AI replace more jobs than it creates in the next decade?", context: "Generative AI adoption is accelerating across white-collar functions like coding, design, and support.", difficulty: "beginner" },
    { topic: "Should AI regulation be global or country-specific?", context: "The EU AI Act, US executive orders, and China's AI rules differ significantly in approach.", difficulty: "intermediate" },
    { topic: "Deepfakes: a threat to democracy or an overhyped fear?", context: "High-profile deepfake incidents have targeted both celebrities and politicians.", difficulty: "placement" },
    { topic: "Is data privacy a fundamental right or a tradeable commodity?", context: "Personalized advertising economics depend on user data that privacy laws increasingly restrict.", difficulty: "elite" },
    { topic: "Should companies be forced to disclose when a customer is talking to AI, not a human?", context: "AI customer service agents are increasingly indistinguishable from humans in text and voice.", difficulty: "intermediate" },
  ],
  business: [
    { topic: "Should startups prioritize profit over purpose from day one?", context: "\"Growth at all costs\" culture has given way to profitability pressure since the 2022 funding winter.", difficulty: "beginner" },
    { topic: "Is ESG investing a genuine business imperative or a marketing exercise?", context: "Some large funds have quietly scaled back ESG mandates amid political and return pressure.", difficulty: "placement" },
    { topic: "Should influencer marketing be regulated like traditional advertising?", context: "Influencers routinely promote products without clear, consistent disclosure standards.", difficulty: "intermediate" },
    { topic: "Are D2C brands a sustainable business model or a funding-driven bubble?", context: "Many venture-backed D2C brands have struggled to reach profitability after early growth.", difficulty: "placement" },
    { topic: "Is brand loyalty dead in the age of price-comparison apps?", context: "Consumers increasingly switch brands based on app-driven price and deal comparisons.", difficulty: "beginner" },
  ],
  economics: [
    { topic: "Should India prioritize manufacturing over services for its next growth phase?", context: "Services contribute over 50% of India's GDP, while manufacturing's share has stagnated near 17%.", difficulty: "placement" },
    { topic: "Is high inflation or high unemployment the bigger risk for emerging economies right now?", context: "Central banks face a tradeoff between taming inflation and supporting growth.", difficulty: "intermediate" },
    { topic: "Free trade vs protectionism: which serves developing economies better today?", context: "Tariff escalation between major economies has revived debate on protectionist industrial policy.", difficulty: "elite" },
    { topic: "Is the gig economy good for workers or a way to avoid labor protections?", context: "Gig platforms classify most workers as independent contractors rather than employees.", difficulty: "beginner" },
  ],
  marketing: [
    { topic: "Has performance marketing made brand-building obsolete?", context: "Digital ad budgets increasingly favor short-term, measurable performance campaigns over brand spend.", difficulty: "intermediate" },
    { topic: "Should brands take a stand on political and social issues?", context: "Several global brands have faced backlash both for taking and for avoiding political stances.", difficulty: "placement" },
    { topic: "Is customer segmentation dead in an era of hyper-personalization?", context: "AI-driven personalization increasingly targets individuals rather than segments.", difficulty: "elite" },
  ],
  abstract: [
    { topic: "The Bridge", context: "An abstract topic — the panel expects candidates to interpret and build a discussion around what \"the bridge\" could represent.", difficulty: "elite" },
    { topic: "The Last Mile", context: "An abstract topic open to interpretation across business, technology, or life contexts.", difficulty: "elite" },
    { topic: "Red vs Blue", context: "An abstract topic — could be interpreted as colors, politics, brands, or something else entirely.", difficulty: "elite" },
    { topic: "Silence Speaks", context: "An abstract topic inviting interpretation beyond the literal phrase.", difficulty: "elite" },
  ],
  "social-issues": [
    { topic: "Is social media doing more harm than good to mental health?", context: "Several countries are debating minimum age limits for social media access.", difficulty: "beginner" },
    { topic: "Should the four-day work week become the norm?", context: "Pilot programs across multiple countries have shown mixed productivity results.", difficulty: "intermediate" },
    { topic: "Is India's education system preparing students for the jobs of the future?", context: "Employers frequently cite a skills gap between graduates and industry needs.", difficulty: "placement" },
    { topic: "Is remote work widening or closing workplace inequality?", context: "Remote work benefits vary significantly by role, seniority, and industry.", difficulty: "intermediate" },
    { topic: "Should corporate boards mandate gender diversity quotas?", context: "Several countries have introduced legal quotas for women on corporate boards.", difficulty: "placement" },
  ],
};

export function getSeedTopics(category: Exclude<TopicCategory, "custom">, difficulty: Difficulty): TopicSeed[] {
  const all = TOPIC_BANK[category];
  const matched = all.filter((t) => t.difficulty === difficulty);
  return matched.length > 0 ? matched : all;
}

export function pickRandomSeedTopic(category: Exclude<TopicCategory, "custom">, difficulty: Difficulty): TopicSeed {
  const pool = getSeedTopics(category, difficulty);
  return pool[Math.floor(Math.random() * pool.length)];
}
