import type { LearningModule } from "../types";

export const PM_MODULES: LearningModule[] = [
  {
    id: "pm-sense",
    roles: ["pm"],
    topic: "Product Sense",
    title: "Product Sense: From User Problem to Solution",
    description: "A dependable structure for 'design a product for X' and 'improve product Y' questions.",
    durationMin: 40,
    difficulty: "Medium",
    objectives: [
      "Clarify the goal and constraints of an open product question",
      "Segment users and choose one segment with a reason",
      "Prioritise pain points before proposing solutions",
      "Define how success would be measured",
    ],
    sections: [
      {
        heading: "Start with the goal and the user",
        body: `Product questions are tests of judgement under ambiguity, so resist jumping to features. Begin by clarifying: What is the business goal — growth, engagement, revenue? Which platform and market? Any constraints?

Then segment the users in a way that reflects different needs, not demographics for their own sake. For a campus food-ordering app: hostel residents ordering late at night, day scholars ordering lunch between classes, and staff ordering for meetings.

Choose **one** segment and say why — size, frequency of the need, how poorly it is served today, or fit with the goal. A deliberate choice beats trying to serve everyone.`,
      },
      {
        heading: "Pain points before solutions",
        body: `Walk through the chosen user's journey step by step and list where it breaks. For the hostel resident: deciding what is open, long waits at peak time, splitting bills with roommates, collecting the order at the gate.

Prioritise pain points by **frequency** (how often it happens) and **severity** (how much it hurts), and note which ones existing alternatives already solve.

Only then generate solutions — aim for three that differ in kind, not three versions of the same idea. For long waits: scheduled pre-orders, a live queue estimate, or batching orders by hostel block.`,
      },
      {
        heading: "Choose, and define success",
        body: `Compare solutions on user impact, effort and risk, pick one, and state the trade-off you are accepting.

Close with measurement:

- A **primary metric** tied to the pain point (share of peak-hour orders delivered within the promised time).
- A **business metric** tied to the goal (orders per active user per week).
- A **guardrail** that should not get worse (cancellation rate, restaurant-partner complaints).

Summarise in three sentences: who you built for, what you would build first and why, and how you would know it worked.`,
      },
    ],
    exercise: {
      prompt: "You are asked to improve the library experience for students at your institute. Pick a user segment and identify the top pain point you would address, with a reason.",
      solution: `One strong answer: segment by intent — students who need a quiet seat for long study sessions, students who need a specific book, and groups who need discussion space.

Choose seat-seekers during exam weeks: the need is frequent, time-critical, and currently solved by walking around looking for a seat. Top pain point: no way to know seat availability before arriving. It is both frequent (daily in exam weeks) and severe (wasted time when time is scarcest).

Success metric: reduction in time from entry to seated; guardrail: seats reserved but unused.`,
    },
  },
  {
    id: "pm-prio",
    roles: ["pm"],
    topic: "Prioritisation",
    title: "Prioritisation Frameworks That Hold Up",
    description: "RICE, impact-versus-effort and MoSCoW — when each helps, and how to defend a ranking.",
    durationMin: 35,
    difficulty: "Medium",
    objectives: [
      "Score initiatives with RICE and interpret the result",
      "Use an impact-effort matrix to sort a backlog quickly",
      "Apply MoSCoW to scope a release",
      "Explain the judgement a framework cannot make for you",
    ],
    sections: [
      {
        heading: "RICE",
        body: `RICE scores an initiative as:

~~~
RICE = (Reach x Impact x Confidence) / Effort
~~~

- **Reach**: how many users are affected in a period (for example users per quarter).
- **Impact**: how much it moves the goal per user, on a fixed scale (3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal).
- **Confidence**: how sure you are of reach and impact, as a percentage.
- **Effort**: person-months across the team.

Example: a feature reaching 4,000 users with impact 2, confidence 80% and effort 4 person-months scores (4000 x 2 x 0.8) / 4 = 1,600. The absolute number means nothing; the ranking against other initiatives does.`,
      },
      {
        heading: "Impact-effort and MoSCoW",
        body: `An **impact-effort matrix** is the fast version: plot items on two axes. High impact and low effort are quick wins; high impact and high effort are major bets to plan deliberately; low impact and low effort are fill-ins; low impact and high effort should be dropped.

**MoSCoW** scopes a release rather than ranking a backlog: Must have (the release fails without it), Should have (important but not vital), Could have (nice if time allows), and Won't have this time (explicitly out of scope). Writing down the Won't list is the most useful part — it prevents scope creep.`,
      },
      {
        heading: "What frameworks cannot decide",
        body: `Frameworks organise judgement; they do not replace it. Three things sit outside the score:

- **Strategy fit**: a lower-scoring item that unlocks the company's main bet can rightly go first.
- **Dependencies and sequencing**: some work must precede other work regardless of score.
- **Risk and obligations**: security fixes, compliance and reliability work rarely win on reach and impact, yet cannot be skipped.

In an interview, show the framework, then show the judgement: "RICE ranks B first, but I would do A first because B depends on the login revamp A delivers."`,
      },
    ],
    exercise: {
      prompt: "Feature A: reach 2,000 users, impact 1, confidence 100%, effort 1 person-month. Feature B: reach 10,000 users, impact 0.5, confidence 50%, effort 5 person-months. Which has the higher RICE score?",
      solution: `A = (2000 x 1 x 1.0) / 1 = 2,000.
B = (10000 x 0.5 x 0.5) / 5 = 500.

Feature A scores four times higher. B reaches more users, but its low impact per user, low confidence and high effort outweigh the reach. A sensible follow-up is to ask what would raise confidence in B cheaply, for example a small experiment.`,
    },
  },
  {
    id: "pm-metrics",
    roles: ["pm"],
    topic: "Metrics",
    title: "Product Metrics and the North Star",
    description: "Pick metrics that reflect user value, organise them in a funnel, and diagnose a metric that moved.",
    durationMin: 40,
    difficulty: "Medium",
    objectives: [
      "Define a North Star metric and its input metrics",
      "Map a product to the acquisition-to-referral funnel",
      "Choose guardrail metrics for a launch",
      "Diagnose a sudden change in a metric systematically",
    ],
    sections: [
      {
        heading: "North Star and inputs",
        body: `A **North Star metric** captures the value users get from the product, in a way that predicts long-term business results. For a ride-hailing app it is closer to completed rides per week than to app downloads.

A good North Star reflects delivered value, is measurable frequently, and can be influenced by the teams. Revenue alone usually fails the first test: it is the result of value, not the value itself.

Break it into **input metrics** that teams can own. Completed rides = riders requesting x share of requests matched x share of matched rides completed. Each input has a clear owner and a clear set of experiments.`,
      },
      {
        heading: "The funnel view",
        body: `The AARRR funnel is a checklist for coverage:

- **Acquisition**: how users arrive (visits, installs by channel).
- **Activation**: the first experience of real value (first order placed, first document shared).
- **Retention**: whether they return (week-4 retention, repeat rate).
- **Revenue**: whether value turns into income (conversion to paid, revenue per user).
- **Referral**: whether they bring others (invites sent and accepted).

Define activation as a behaviour that correlates with later retention, not merely "signed up". For a launch, also name **guardrails** — metrics that must not degrade, such as crash rate, support tickets or unsubscribe rate.`,
      },
      {
        heading: "When a metric moves",
        body: `For "daily active users dropped 10% yesterday", work from cheap checks to expensive ones:

- **Is it real?** Check tracking, dashboards, time zones and data delays first.
- **Is it expected?** Seasonality, holidays, the end of a campaign.
- **Where is it?** Segment by platform, app version, region, new versus returning users, and acquisition channel.
- **What changed?** Internal: releases, experiments, pricing, outages. External: competitor moves, platform policy, news.

Then follow the funnel to find the step that broke. State a hypothesis, the data that would confirm it, and the action you would take if it holds.`,
      },
    ],
    exercise: {
      prompt: "Propose a North Star metric for a language-learning app and two input metrics that drive it.",
      solution: `North Star: weekly learners completing at least three lessons — it reflects real learning progress rather than app opens, and predicts retention and subscription.

Inputs: (1) activation rate — share of new users who complete their first lesson within 24 hours; (2) habit strength — share of weekly learners with a streak of three or more days.

Guardrail: lesson completion accuracy, so that making lessons trivially easy does not inflate the count.`,
    },
  },
  {
    id: "pm-strategy",
    roles: ["pm"],
    topic: "Product Strategy",
    title: "Product Strategy: Where to Play and How to Win",
    description: "Reason about markets, competition and positioning, and answer 'should we enter or build this?'",
    durationMin: 40,
    difficulty: "Hard",
    objectives: [
      "Describe a strategy as a set of choices and trade-offs",
      "Assess a market using customers, competitors and company capabilities",
      "Identify sources of durable advantage",
      "Structure a go or no-go answer for a new product",
    ],
    sections: [
      {
        heading: "Strategy is choice",
        body: `A strategy states who you serve, what you offer them that alternatives do not, and what you will deliberately not do. "Be the best app for everyone" is an aspiration; "the fastest way for small shops to accept digital payments, with no hardware" is a strategy because it excludes things.

Test a strategy statement with one question: is the opposite also a reasonable choice for some company? If nobody would choose the opposite, you have stated a platitude.`,
      },
      {
        heading: "Reading the market",
        body: `A compact scan covers three views:

- **Customer**: which segments exist, how big each is, what job they are trying to get done, and how they solve it today.
- **Competition**: direct rivals, substitutes, and the option of doing nothing. Where are they strong, and which segment do they neglect?
- **Company**: what assets you bring — distribution, data, brand, technology, cost position.

Look for a segment that is underserved, reachable through channels you already have, and where your assets matter. Sizing does not need precision: estimate users x adoption x revenue per user, state assumptions, and sanity-check the result.`,
      },
      {
        heading: "Durable advantage and the entry decision",
        body: `An advantage is durable when it is hard to copy: **network effects** (each user makes the product more valuable to others), **switching costs** (data or workflows that are painful to move), **scale economies** (unit cost falls with volume), and **brand** or trust.

For "should we build X?", structure the answer:

- Is the market attractive — size, growth, margins?
- Can we win — do we have a real advantage and a reachable first segment?
- Is it worth it — investment, payback, and what we give up by not doing something else?
- What is the main risk, and what small test would reduce it?

Give a clear recommendation and the condition that would change your mind.`,
      },
    ],
    exercise: {
      prompt: "A food-delivery company is considering launching grocery delivery. Name one strategic advantage it brings and one major risk.",
      solution: `Advantage: existing demand and distribution — a large base of active customers with saved addresses and payment methods, plus a rider fleet that is under-used outside meal peaks. Customer acquisition cost for grocery would be far below a new entrant's.

Risk: grocery economics differ — lower margins, inventory or dark-store investment, and larger baskets that need different handling. If grocery orders compete for riders at dinner time, the core business's delivery times could suffer, so delivery time on food orders is the guardrail to watch in a pilot.`,
    },
  },
  {
    id: "pm-research",
    roles: ["pm", "marketing"],
    topic: "User Research",
    title: "User Research: Learning What Users Actually Need",
    description: "Pick the right method, run an interview that does not lead the witness, and turn notes into insight.",
    durationMin: 30,
    difficulty: "Easy",
    objectives: [
      "Match research methods to the question being asked",
      "Write open, non-leading interview questions",
      "Separate what users say from what they do",
      "Synthesise observations into a need statement",
    ],
    sections: [
      {
        heading: "Choosing a method",
        body: `Methods differ on two axes: **qualitative versus quantitative** (why versus how many) and **attitudinal versus behavioural** (what people say versus what they do).

- **Interviews** — qualitative, attitudinal. Best for discovering problems and motivations.
- **Usability tests** — qualitative, behavioural. Best for finding where a design confuses people; five participants reveal most major issues in a flow.
- **Surveys** — quantitative, attitudinal. Best for sizing how common a known opinion is.
- **Analytics and A/B tests** — quantitative, behavioural. Best for measuring what happens and whether a change caused it.

Use qualitative methods to learn what to ask, then quantitative methods to learn how widespread it is.`,
      },
      {
        heading: "Interviewing without leading",
        body: `Ask about past behaviour, not hypothetical futures. "Tell me about the last time you split a bill with friends" produces facts; "Would you use a bill-splitting feature?" produces politeness.

- Prefer open questions that start with how, what, or tell me about.
- Avoid leading phrasing such as "Don't you find it annoying when...".
- Ask "why" and "what happened next" to get past the first answer.
- Stay quiet after a question; silence invites detail.
- Do not pitch your solution during discovery — you will get compliments instead of evidence.`,
      },
      {
        heading: "From notes to insight",
        body: `After several interviews, group observations that share a theme (affinity mapping), then write each theme as a need statement:

~~~
[User] needs a way to [do something] because [reason],
but currently [obstacle].
~~~

Example: "Hostel students need a way to settle shared expenses the same day because small debts are awkward to chase, but currently they track them in chat messages that get buried."

Give more weight to what people did, paid for, or built a workaround for than to what they said they want. A workaround is the strongest evidence of a real need.`,
      },
    ],
    exercise: {
      prompt: "Rewrite this leading question so it produces reliable evidence: 'Would you like an app that reminds you to study?'",
      solution: `Better: "Tell me about the last time you planned to study and did not. What happened?" followed by "What have you tried to stay on schedule?"

The original is hypothetical and invites a polite yes. The rewrite asks about a specific past event and existing workarounds, which reveals whether the problem is real, how often it occurs, and what the person already does about it.`,
    },
  },
  {
    id: "pm-exec",
    roles: ["pm"],
    topic: "Product Execution",
    title: "Product Execution: Shipping and Learning",
    description: "Write a clear spec, scope a first version, launch safely and decide with experiment results.",
    durationMin: 35,
    difficulty: "Medium",
    objectives: [
      "Write user stories with testable acceptance criteria",
      "Scope a minimum viable version around the riskiest assumption",
      "Plan a staged rollout with success and rollback criteria",
      "Read an A/B test result without over-claiming",
    ],
    sections: [
      {
        heading: "Specs engineers can build from",
        body: `A requirement is clear when two people would build the same thing from it. A user story gives the intent:

~~~
As a [user], I want to [action] so that [benefit].
~~~

Acceptance criteria make it testable: "Given a cart above 500, when the user applies code WELCOME, then the total reduces by 10% and the discount line is shown."

A good spec also states the problem and evidence, what is out of scope, edge cases (empty states, errors, slow networks), and how success will be measured. Describe the what and why; leave the how to engineering.`,
      },
      {
        heading: "Scoping a first version",
        body: `A minimum viable product is the smallest thing that tests your riskiest assumption with real users — not a smaller, worse copy of the full vision.

Ask what must be true for the idea to work, and which of those beliefs you are least sure about. If the risk is "will students pre-order lunch at all?", a form and a manual process can test it before any app is built.

Cut scope by narrowing the audience or the use case, not by shipping something unreliable. One flow that works end to end beats five half-built ones.`,
      },
      {
        heading: "Launching and reading experiments",
        body: `Roll out in stages — internal users, then 5%, 25%, 100% — with **success criteria** and **rollback criteria** written beforehand. Watch guardrails such as error rate, latency and support tickets at each stage.

For an A/B test:

- Decide the primary metric and sample size before starting.
- Run it for full weekly cycles so weekday and weekend behaviour are both included.
- A result is convincing when the difference is statistically significant **and** large enough to matter.
- Do not stop early because the numbers look good, and do not hunt through many metrics for one that won.
- Check guardrails and key segments before shipping.

After launch, write down what you expected, what happened, and what you learned.`,
      },
    ],
    exercise: {
      prompt: "You want to test whether students would pay for same-day printing delivered to hostels. Describe a minimum viable test.",
      solution: `Riskiest assumption: enough students will pay a delivery premium, often enough, to make it worthwhile.

MVP: a simple order form shared in two hostels, payment by UPI, fulfilled manually through an existing print shop for two weeks. No app.

Measure: orders per day, repeat orders per student, and willingness to pay at two price points. Success criterion set in advance, for example 15 or more orders a day with at least 30% repeat customers. If it clears the bar, automate the highest-effort manual step first.`,
    },
  },
];
