import type { LearningModule, RoleId } from "../types";

const ALL: RoleId[] = ["ba", "pm", "marketing", "finance", "consulting", "software"];

export const MORE_MODULES: LearningModule[] = [
  {
    id: "common-star",
    roles: ALL,
    topic: "Behavioural",
    title: "Structured Answers with STAR",
    description: "Turn an experience into a two-minute answer with a clear situation, action and measurable result.",
    durationMin: 25,
    difficulty: "Easy",
    objectives: [
      "Structure a behavioural answer using Situation, Task, Action, Result",
      "Spend most of the answer on your own actions",
      "Quantify results and state what you learned",
      "Prepare a bank of stories that covers common themes",
    ],
    sections: [
      {
        heading: "The four parts",
        body: `Behavioural questions ("Tell me about a time when...") assume past behaviour predicts future behaviour. STAR keeps the answer complete and short:

- **Situation** — the context in one or two sentences.
- **Task** — what you specifically were responsible for.
- **Action** — what you did, step by step, and why. This should be more than half the answer.
- **Result** — what changed, with a number where possible, and what you learned.

Aim for about two minutes. If the situation takes longer than twenty seconds to explain, pick a simpler story.`,
      },
      {
        heading: "Common mistakes",
        body: `- Saying **"we"** throughout. Interviewers are hiring you; say "I" for your contribution and credit the team for theirs.
- Describing the situation at length and rushing the action.
- Ending without a result. If the outcome was poor, say so and state what you would do differently — an honest lesson is a strong ending.
- Vague results such as "it went well". Prefer "registrations rose from 120 to 310" or "we delivered two days early".
- Choosing a story that does not match the question. Listen for the trait being tested: conflict, leadership, failure, initiative.`,
      },
      {
        heading: "Build a story bank",
        body: `Prepare six to eight stories from projects, internships, committees, competitions and part-time work. Tag each with the themes it can serve:

- Leadership or initiative
- Conflict or disagreement
- Failure or a mistake
- Working under pressure or a tight deadline
- Persuading someone without authority
- Learning something quickly

One story can answer several questions if you change the emphasis. Write each as four bullet points, not a script — memorised scripts sound flat and collapse under follow-up questions.`,
      },
    ],
    exercise: {
      prompt: "Write a four-bullet STAR outline for a time you handled a disagreement in a team project.",
      solution: `Example outline:
- Situation: Four-member market-research project; two teammates disagreed on survey versus interviews with one week left.
- Task: As coordinator, I had to settle the method so fieldwork could start.
- Action: I asked each to state what decision their method would support, proposed ten interviews to shape a short survey, split the work, and set a two-day checkpoint.
- Result: Submitted on time with 140 survey responses; scored in the top three teams. I learned to move a disagreement from positions to the decision the work has to support.`,
    },
  },
  {
    id: "common-resume",
    roles: ALL,
    topic: "HR & Resume",
    title: "Resume Walkthrough and HR Questions",
    description: "Answer 'tell me about yourself', 'why this role' and resume-based probes with substance.",
    durationMin: 25,
    difficulty: "Easy",
    objectives: [
      "Deliver a 90-second introduction with a clear thread",
      "Defend every line of your resume with specifics",
      "Answer 'why this role' and 'why this company' credibly",
      "Discuss weaknesses and gaps honestly",
    ],
    sections: [
      {
        heading: "Tell me about yourself",
        body: `This is an invitation to guide the interview, not to recite your resume. Use a present-past-future thread in about 90 seconds:

- **Present**: what you are studying and the area you are focused on.
- **Past**: two experiences that built relevant skills, each with one concrete result.
- **Future**: why this role is the logical next step.

End on the role, so the interviewer's next question follows from something you want to talk about.`,
      },
      {
        heading: "Owning your resume",
        body: `Anything on your resume is fair game. For every line, be ready to explain what the goal was, what you did personally, which tools or methods you used, what the result was, and what you would change.

Write bullets as action + method + result: "Analysed 14 months of sales data in Excel to identify three under-performing product lines; recommendations adopted for the next quarter's plan."

Do not list a skill you cannot answer two follow-up questions about. A shorter, defensible resume is safer than an impressive one that cracks under probing.`,
      },
      {
        heading: "Why this role, and the hard questions",
        body: `For **why this role**, connect evidence to interest: something you did, what you enjoyed about it, and how the role offers more of it. For **why this company**, name one or two specifics — a product, a market position, how the team works — rather than "it is a great brand".

For **weaknesses**, choose a real one that is not central to the role, give an example, and say what you are doing about it. "I am a perfectionist" is heard as avoidance.

For gaps, low grades or a change of field, state the fact briefly, give the reason without excuses, and move to what you did next. Calm and brief is more convincing than a long justification.`,
      },
    ],
    exercise: {
      prompt: "Rewrite this resume bullet to show action, method and result: 'Worked on social media for the college fest.'",
      solution: `"Planned and ran a three-week Instagram campaign for the annual fest using a content calendar and student-ambassador reposts; follower count grew from 2,100 to 3,400 and online registrations rose 38% over the previous year."

The rewrite names what you did, how you did it and what changed. Use your real numbers — if you do not have exact figures, give an honest approximation and be ready to explain how you estimated it.`,
    },
  },
  {
    id: "mkt-fund",
    roles: ["marketing"],
    topic: "Marketing Fundamentals",
    title: "Segmentation, Targeting and Positioning",
    description: "The STP backbone of marketing interviews, with the 4Ps and core digital metrics.",
    durationMin: 35,
    difficulty: "Easy",
    objectives: [
      "Segment a market on bases that predict different behaviour",
      "Choose a target segment and write a positioning statement",
      "Translate positioning into product, price, place and promotion",
      "Calculate CTR, conversion rate, CPA and ROAS",
    ],
    sections: [
      {
        heading: "Segmentation and targeting",
        body: `Segmentation divides a market into groups that respond differently. Common bases are demographic (age, income), geographic, psychographic (values, lifestyle) and behavioural (usage, occasion, benefits sought). Behavioural and needs-based segments are usually the most actionable.

A useful segment is measurable, large enough to matter, reachable through some channel, and distinct in how it responds.

Targeting is the choice of which segment to serve first. Evaluate each on size and growth, how well current options serve it, and your ability to win there.`,
      },
      {
        heading: "Positioning and the 4Ps",
        body: `Positioning is the place you want to own in the target customer's mind relative to alternatives:

~~~
For [target], [brand] is the [category] that [key benefit]
because [reason to believe].
~~~

The marketing mix then has to deliver that promise consistently: **Product** (features, quality, packaging), **Price** (level, discounts, perceived value), **Place** (channels and availability) and **Promotion** (messages and media). A premium positioning sold through heavy discounting is the classic inconsistency interviewers ask you to spot.`,
      },
      {
        heading: "Digital metrics",
        body: `- **CTR** (click-through rate) = clicks / impressions.
- **Conversion rate** = conversions / clicks.
- **CPA** (cost per acquisition) = spend / conversions.
- **ROAS** (return on ad spend) = revenue attributed to ads / ad spend.

Example: 200,000 impressions, 4,000 clicks, 200 purchases, spend 40,000, revenue 160,000. CTR is 2%, conversion rate 5%, CPA 200, ROAS 4. A high CTR with low conversion points to a mismatch between the ad's promise and the landing page.`,
      },
    ],
    exercise: {
      prompt: "Write a positioning statement for a new sugar-free energy drink aimed at college students during exam season.",
      solution: `"For college students facing long study sessions, FocusUp is the energy drink that keeps you alert for hours without a sugar crash, because it combines moderate caffeine with zero sugar."

It names a specific target and occasion, the category, one key benefit set against the alternative (sugary drinks that cause a crash), and a reason to believe. FocusUp is an invented name for this exercise.`,
    },
  },
  {
    id: "fin-fund",
    roles: ["finance"],
    topic: "Accounting",
    title: "Financial Statements and Ratio Analysis",
    description: "How the three statements connect, and the ratios interviewers expect you to compute and interpret.",
    durationMin: 40,
    difficulty: "Medium",
    objectives: [
      "Explain what each of the three financial statements shows",
      "Trace how a transaction flows through all three",
      "Compute profitability, liquidity and leverage ratios",
      "Explain the time value of money and NPV in plain language",
    ],
    sections: [
      {
        heading: "The three statements",
        body: `- The **income statement** shows performance over a period: revenue − expenses = net profit.
- The **balance sheet** shows position at a point in time: assets = liabilities + equity.
- The **cash flow statement** explains the change in cash, split into operating, investing and financing activities.

They connect: net profit flows into retained earnings on the balance sheet and is the starting point of operating cash flow. Profit is not cash — a sale on credit raises profit and receivables but not cash.

A classic question: depreciation rises by 100, tax rate 30%. Pre-tax profit falls 100, tax falls 30, net profit falls 70. Cash rises by 30, because depreciation is non-cash and is added back (−70 + 100). On the balance sheet, assets fall 70 (fixed assets −100, cash +30) and retained earnings fall 70.`,
      },
      {
        heading: "Ratios that matter",
        body: `- **Profitability**: gross margin = gross profit / revenue; net margin = net profit / revenue; return on equity (ROE) = net profit / shareholders' equity.
- **Liquidity**: current ratio = current assets / current liabilities; the quick ratio excludes inventory.
- **Leverage**: debt-to-equity = total debt / equity; interest coverage = EBIT / interest expense.
- **Efficiency**: inventory turnover = cost of goods sold / average inventory.

A ratio means little alone. Compare it with the company's own history and with peers in the same industry — a current ratio that is healthy for a manufacturer may be unusual for a supermarket chain.`,
      },
      {
        heading: "Time value of money",
        body: `Money today is worth more than the same amount later because it can earn a return. Present value discounts a future cash flow:

~~~
PV = FV / (1 + r)^n
~~~

At a 10% rate, 121 received in two years is worth 121 / 1.21 = 100 today.

**Net present value (NPV)** is the sum of discounted future cash flows minus the initial investment. A positive NPV means the project earns more than the required return. The **internal rate of return (IRR)** is the discount rate at which NPV equals zero.`,
      },
    ],
    exercise: {
      prompt: "A project costs 1,000 today and returns 600 at the end of year 1 and 600 at the end of year 2. At a 10% discount rate, is the NPV positive?",
      solution: `PV of year 1 = 600 / 1.10 = 545.45
PV of year 2 = 600 / 1.21 = 495.87
NPV = 545.45 + 495.87 − 1,000 = 41.32

The NPV is positive, so the project earns more than the 10% required return and should be accepted on this measure.`,
    },
  },
  {
    id: "con-fund",
    roles: ["consulting"],
    topic: "Case Frameworks",
    title: "Case Frameworks and Market Sizing",
    description: "Profitability trees, MECE structures and top-down estimates you can defend.",
    durationMin: 40,
    difficulty: "Medium",
    objectives: [
      "Build a MECE structure for a business problem",
      "Apply the profitability framework to isolate a cause",
      "Size a market top-down with stated assumptions",
      "Communicate answer-first",
    ],
    sections: [
      {
        heading: "MECE and the profitability tree",
        body: `**MECE** means mutually exclusive, collectively exhaustive: branches do not overlap and nothing falls outside them. It keeps analysis complete without double counting.

The profitability tree is the most common MECE structure:

~~~
Profit = Revenue - Cost
Revenue = Price x Volume
Cost = Fixed cost + Variable cost per unit x Volume
~~~

Establish which side moved, then drill only into that branch. Frameworks are starting points — adapt the branches to the business in front of you rather than reciting a memorised list.`,
      },
      {
        heading: "Market sizing",
        body: `Sizing questions test structured estimation, not recall. Work top-down from a population to a number, stating each assumption:

~~~
Annual market = Population x share who are users
                x purchases per year x price per purchase
~~~

Example — cups of tea sold by vendors on a 5,000-student campus per day: assume 60% drink tea from vendors, averaging 1.5 cups a day, giving 5,000 x 0.6 x 1.5 = 4,500 cups. At 10 per cup that is 45,000 a day.

Round numbers to keep the arithmetic clean, segment when groups behave differently, and sanity-check the answer from another angle (for example, vendors x cups per vendor).`,
      },
      {
        heading: "Answer-first communication",
        body: `Consultants lead with the conclusion, then support it — the pyramid principle:

- **Answer**: one sentence the client could act on.
- **Supporting points**: two or three reasons, each backed by a fact.
- **Next steps**: what to do or verify next.

In a case, signpost as you go: "I will look at three areas: first..., second..., third...". When you receive data, state the so-what rather than repeating the number. End with a recommendation, the main risk, and the next analysis you would run.`,
      },
    ],
    exercise: {
      prompt: "Estimate the number of laptops sold to first-year students at a university that admits 2,000 students a year. State your assumptions.",
      solution: `Assume 2,000 first-year students; 70% already own a laptop on arrival; of the remaining 30% (600), about 80% buy one in the first year = 480. Add about 5% of existing owners replacing theirs (0.05 x 1,400 = 70).

Estimate: roughly 550 laptops a year. Sanity check: that is about 27% of the batch, which is plausible. The answer matters less than a clear, segmented structure and explicit assumptions.`,
    },
  },
  {
    id: "sw-fund",
    roles: ["software"],
    topic: "Data Structures",
    title: "Core Data Structures and Complexity",
    description: "Big-O reasoning and the structures behind most first-round coding questions.",
    durationMin: 45,
    difficulty: "Medium",
    objectives: [
      "State time complexity for common operations on arrays, lists, stacks, queues and hash maps",
      "Choose a data structure from the operations a problem needs",
      "Compare linear and binary search",
      "Explain an approach before coding it",
    ],
    sections: [
      {
        heading: "Big-O in practice",
        body: `Big-O describes how running time or memory grows as the input grows, ignoring constants. From slowest-growing to fastest-growing: O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n), O(n^2) quadratic.

- A single loop over n items is O(n).
- Two nested loops over n items are O(n^2).
- Halving the search space each step is O(log n).
- Efficient comparison sorts such as merge sort are O(n log n).

In interviews, state the brute-force complexity first, then explain what makes your improved approach faster.`,
      },
      {
        heading: "Choosing a structure",
        body: `- **Array**: O(1) access by index; inserting in the middle is O(n) because elements shift.
- **Linked list**: O(1) insertion or deletion at a known node; O(n) to find a position.
- **Stack** (last in, first out): undo, matching brackets, depth-first traversal.
- **Queue** (first in, first out): scheduling, breadth-first traversal.
- **Hash map**: average O(1) lookup, insert and delete by key; no ordering.
- **Binary search tree**: O(log n) search and insert when balanced, with keys kept in sorted order.

Start from the operations the problem needs most often. "Have I seen this value before?" almost always means a hash set or hash map.`,
      },
      {
        heading: "Searching and explaining",
        body: `**Linear search** checks every element: O(n), works on any list. **Binary search** repeatedly halves a **sorted** array: O(log n). For a million sorted items that is about 20 comparisons instead of up to a million.

~~~
low = 0, high = n - 1
while low <= high:
    mid = (low + high) // 2
    if a[mid] == target: return mid
    if a[mid] < target: low = mid + 1
    else: high = mid - 1
return -1
~~~

Before coding, restate the problem, walk through an example, state your approach and its complexity, and mention edge cases (empty input, duplicates, a single element). Then code, and trace the example through your code.`,
      },
    ],
    exercise: {
      prompt: "Given an array of integers, how would you check whether any value appears twice? Give the approach and its complexity.",
      solution: `Brute force: compare every pair — O(n^2) time, O(1) extra space.

Better: iterate once, keeping a hash set of values seen. For each value, if it is already in the set return true; otherwise add it. This is O(n) time on average and O(n) extra space.

Alternative when extra space is not allowed: sort the array (O(n log n)) and check adjacent elements.`,
    },
  },
];
