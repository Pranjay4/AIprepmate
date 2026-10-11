import type { LearningModule } from "../types";

// Original CampusPrep lesson content. Code blocks are fenced with ~~~ lines.
// SQL examples use the practice dataset in lib/cp/content/sqlData.ts.

export const BA_MODULES: LearningModule[] = [
  {
    id: "ba-sql-1",
    roles: ["ba"],
    topic: "SQL",
    title: "SQL Fundamentals: SELECT, WHERE, GROUP BY",
    description: "Read a table, filter rows, and summarise them — the three moves behind most analyst screening questions.",
    durationMin: 40,
    difficulty: "Easy",
    objectives: [
      "Write SELECT queries that return only the columns and rows you need",
      "Combine filters with AND, OR, IN and BETWEEN",
      "Summarise data with COUNT, SUM, AVG and GROUP BY",
      "Explain the difference between WHERE and HAVING",
    ],
    sections: [
      {
        heading: "Reading and filtering rows",
        body: `A query describes the result you want, not the steps to get it. Start with the table (FROM), keep the rows you need (WHERE), then choose the columns (SELECT).

~~~
SELECT order_id, amount
FROM orders
WHERE status = 'Delivered' AND amount > 2000
ORDER BY amount DESC;
~~~

- Text values go in single quotes; numbers do not.
- **IN** replaces a chain of ORs: status IN ('Cancelled', 'Returned').
- **BETWEEN** is inclusive at both ends.
- NULL is never equal to anything. Use **IS NULL**, not = NULL.`,
      },
      {
        heading: "Aggregating with GROUP BY",
        body: `Aggregate functions collapse many rows into one value. GROUP BY produces one output row per group.

~~~
SELECT customer_id, COUNT(*) AS orders, SUM(amount) AS revenue
FROM orders
WHERE status = 'Delivered'
GROUP BY customer_id;
~~~

A simple rule keeps you out of trouble: every column in SELECT must either be inside an aggregate or listed in GROUP BY.

COUNT(*) counts rows. COUNT(column) counts only the rows where that column is not NULL — interviewers like to test this difference.`,
      },
      {
        heading: "WHERE versus HAVING",
        body: `WHERE filters rows **before** grouping. HAVING filters groups **after** aggregation.

~~~
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department
HAVING AVG(salary) > 69000;
~~~

The logical order of a query is FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. That is why you cannot use an aggregate in WHERE: the groups do not exist yet at that point.`,
      },
    ],
    exercise: {
      prompt: "Using the orders table, write a query that returns each status and the number of orders with that status, showing only statuses that have more than one order.",
      solution: `SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
HAVING COUNT(*) > 1;

Delivered (7) and Cancelled (2) are returned; Returned has only one order and is filtered out by HAVING.`,
    },
    external: [
      { label: "PostgreSQL official tutorial: The SQL Language", url: "https://www.postgresql.org/docs/current/tutorial-sql.html" },
    ],
  },
  {
    id: "ba-sql-2",
    roles: ["ba"],
    topic: "SQL",
    title: "Intermediate SQL: JOINs and Multi-Step Queries",
    description: "Combine tables correctly, avoid double counting, and break a business question into query steps.",
    durationMin: 50,
    difficulty: "Medium",
    objectives: [
      "Choose between INNER JOIN and LEFT JOIN for a given question",
      "Predict how many rows a join returns",
      "Aggregate across joined tables without double counting",
      "Translate a business question into a join, a filter and a grouping",
    ],
    sections: [
      {
        heading: "INNER and LEFT joins",
        body: `A join matches rows from two tables on a key. **INNER JOIN** keeps only matches. **LEFT JOIN** keeps every row of the left table and fills the right side with NULL when there is no match.

~~~
SELECT c.name, o.order_id, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id;
~~~

In the practice data, one customer has never ordered. An INNER JOIN silently drops that customer; a LEFT JOIN keeps them with NULL order columns. If the question says "all customers, including those with no orders", it is asking for a LEFT JOIN.`,
      },
      {
        heading: "Counting after a join",
        body: `Joins multiply rows: a customer with three orders appears three times. That is fine for order-level sums, but it breaks customer-level counts.

~~~
SELECT c.name, COUNT(o.order_id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.name;
~~~

- Use COUNT(o.order_id), not COUNT(*), so a customer with no orders shows 0 instead of 1.
- Use COUNT(DISTINCT customer_id) when you need unique customers from an order-level table.
- A filter on the right table placed in WHERE turns a LEFT JOIN back into an INNER JOIN. Put that condition in the ON clause instead.`,
      },
      {
        heading: "From business question to query",
        body: `Take "Which cities generated more than 3,000 in delivered revenue?" and break it down:

- Grain of the answer: one row per city.
- Tables: orders has revenue, customers has city, so join them.
- Row filter: delivered orders only (WHERE).
- Group filter: revenue above 3,000 (HAVING).

~~~
SELECT c.city, SUM(o.amount) AS revenue
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.status = 'Delivered'
GROUP BY c.city
HAVING SUM(o.amount) > 3000
ORDER BY revenue DESC;
~~~

Saying this breakdown out loud before typing is exactly what interviewers want to hear.`,
      },
    ],
    exercise: {
      prompt: "Write a query that lists every employee's name next to their manager's name. Employees without a manager can be left out.",
      solution: `SELECT e.name, m.name AS manager
FROM employees e
JOIN employees m ON e.manager_id = m.emp_id;

This is a self join: the employees table is used twice with different aliases. Switch to LEFT JOIN if the question asks to keep employees who have no manager.`,
    },
  },
  {
    id: "ba-excel",
    roles: ["ba", "finance"],
    topic: "Excel",
    title: "Excel for Analysis: Lookups, Pivots and Clean Data",
    description: "The spreadsheet skills most often tested in analyst assessments and used in the first month of the job.",
    durationMin: 35,
    difficulty: "Easy",
    objectives: [
      "Use lookup functions and explain when each one fails",
      "Summarise a table with a PivotTable",
      "Apply conditional aggregation with SUMIFS and COUNTIFS",
      "Use absolute and relative references correctly",
    ],
    sections: [
      {
        heading: "Lookups",
        body: `**VLOOKUP(value, table, column_number, FALSE)** finds a value in the first column of a range and returns something from a column to its right. Always pass FALSE (exact match) unless you are deliberately looking up ranges such as tax slabs.

Its limits are worth knowing: it cannot look to the left, and inserting a column silently changes what the column number points to.

**INDEX + MATCH** avoids both problems: MATCH finds the row position, INDEX returns the value at that position from any column. **XLOOKUP** does the same in one function in newer versions of Excel and lets you set a not-found value.

A lookup that returns #N/A usually means the key does not match exactly — trailing spaces and numbers stored as text are the usual causes.`,
      },
      {
        heading: "PivotTables and conditional aggregation",
        body: `A PivotTable answers "show me X by Y" without formulas. Put the dimension in Rows (for example Region), the measure in Values (Sum of Sales), and optionally a second dimension in Columns (Month).

When you need the same result inside a formula, use the conditional aggregation family:

- **SUMIFS(sum_range, criteria_range1, criteria1, ...)** adds values meeting every condition.
- **COUNTIFS** counts rows meeting every condition.
- **AVERAGEIFS** averages them.

Note that SUMIFS takes the sum range first, while the older SUMIF takes it last.`,
      },
      {
        heading: "References and clean data",
        body: `When a formula is copied, **relative** references (A2) shift, **absolute** references ($A$2) stay fixed, and **mixed** references ($A2 or A$2) fix only the column or only the row. Lock the reference to a rate or lookup table before filling a formula down.

Before analysing, spend two minutes on data hygiene:

- TRIM removes stray spaces that break lookups.
- Remove Duplicates only after deciding which columns define a duplicate.
- Keep one header row, one record per row, and no merged cells, so the range works as a PivotTable source.`,
      },
    ],
    exercise: {
      prompt: "A sheet has Region in column A, Month in column B and Sales in column C (rows 2–500). Write a formula for total Sales in the West region in March.",
      solution: `=SUMIFS(C2:C500, A2:A500, "West", B2:B500, "March")

The sum range comes first, followed by pairs of criteria range and criteria. A PivotTable with Region in Rows and Month in Columns gives the same number without a formula.`,
    },
    external: [{ label: "Microsoft Support: Excel help and learning", url: "https://support.microsoft.com/excel" }],
  },
  {
    id: "ba-stats",
    roles: ["ba"],
    topic: "Statistics",
    title: "Descriptive Statistics for Business Data",
    description: "Summarise a dataset honestly: centre, spread, outliers and what correlation does and does not tell you.",
    durationMin: 40,
    difficulty: "Medium",
    objectives: [
      "Choose between mean and median for a given distribution",
      "Interpret standard deviation and percentiles",
      "Identify outliers and decide how to treat them",
      "Distinguish correlation from causation in a business setting",
    ],
    sections: [
      {
        heading: "Centre: mean, median, mode",
        body: `The **mean** uses every value, so a few extreme values pull it. The **median** is the middle value and resists extremes.

Example: order values of 200, 250, 300, 350 and 4,000 have a mean of 1,020 but a median of 300. "A typical order is about 300" describes customers better than "the average order is 1,020".

Use the median for skewed quantities such as income, order value and delivery time. Use the mean when the distribution is roughly symmetric or when you need totals (mean times count equals the sum).`,
      },
      {
        heading: "Spread: range, standard deviation, percentiles",
        body: `Two branches can have the same average daily sales and very different risk. Spread captures that.

- **Range** is max minus min — easy, but driven entirely by two points.
- **Standard deviation** is the typical distance of a value from the mean. Larger means less predictable.
- **Percentiles** describe position: the 90th percentile delivery time is the value 90% of deliveries beat. Service targets are often set on percentiles because customers remember the slow experiences.
- The **interquartile range** (75th minus 25th percentile) covers the middle half of the data. A common rule flags values more than 1.5 IQRs beyond the quartiles as outliers.

Do not delete outliers automatically. First ask whether the value is an error, a rare but real event, or a different population (for example bulk orders).`,
      },
      {
        heading: "Correlation is not causation",
        body: `Correlation ranges from -1 to +1 and measures how closely two variables move together in a straight-line sense. It says nothing about why.

If stores with more staff have higher sales, staff may drive sales, sales may drive staffing decisions, or store size may drive both. Before recommending action from a correlation, check three things:

- **Direction** — could the effect run the other way?
- **Confounders** — is a third factor moving both?
- **Chance** — is the sample large enough to trust?

A controlled experiment (an A/B test) is the cleanest way to establish cause, because random assignment balances the confounders.`,
      },
    ],
    exercise: {
      prompt: "Monthly salaries in a seven-person team are 30k, 32k, 35k, 36k, 38k, 40k and 200k. Which measure of centre would you report to describe a typical salary, and why?",
      solution: `Report the median, 36k. The mean is about 58.7k because the single 200k salary pulls it upward, and nobody except that one person earns close to the mean. The median is unaffected by the extreme value and reflects what a typical team member earns.`,
    },
    external: [{ label: "Khan Academy: Statistics and probability", url: "https://www.khanacademy.org/math/statistics-probability" }],
  },
  {
    id: "ba-metrics",
    roles: ["ba", "pm"],
    topic: "Business Metrics",
    title: "Business Metrics and KPIs",
    description: "The revenue, retention and unit-economics metrics analysts are expected to define, calculate and question.",
    durationMin: 35,
    difficulty: "Easy",
    objectives: [
      "Define and calculate conversion rate, AOV, retention and churn",
      "Relate customer acquisition cost to lifetime value",
      "Decompose a headline metric into its drivers",
      "Select a KPI that matches a stated business goal",
    ],
    sections: [
      {
        heading: "The core vocabulary",
        body: `- **Conversion rate** = conversions / visitors. Always state the step: visit to signup is not signup to purchase.
- **Average order value (AOV)** = revenue / number of orders.
- **Retention rate** = customers still active at the end of a period / customers at the start. **Churn rate** is its complement.
- **Customer acquisition cost (CAC)** = sales and marketing spend / new customers acquired.
- **Lifetime value (LTV)** = the margin a customer generates over their whole relationship. A simple version is average monthly margin per customer divided by monthly churn.
- **Gross margin** = (revenue − cost of goods sold) / revenue.

A ratio needs a clearly defined numerator, denominator and time window. Most metric disagreements are definition disagreements.`,
      },
      {
        heading: "Decomposing a metric",
        body: `A headline number rarely tells you what to do. Break it into drivers that multiply or add up to it:

~~~
Revenue = Visitors x Conversion rate x Average order value
~~~

If revenue fell 10%, exactly one of three things is true: fewer visitors came, fewer of them bought, or they spent less per order. Each points to a different team and a different fix.

Then segment the driver that moved: by channel, device, city, new versus returning customers. A change that appears in only one segment is usually the root cause; a change that appears everywhere suggests a tracking or pricing issue.`,
      },
      {
        heading: "Choosing a KPI",
        body: `A good KPI is tied to the goal, sensitive to the team's actions, and hard to game.

- For a goal of profitable growth, track LTV to CAC (a ratio above about 3 is a common rule of thumb, not a law) rather than signups alone.
- Pair a metric with a **guardrail** so it is not improved at something else's expense: conversion rate with refund rate, delivery speed with order accuracy.
- Prefer **leading** indicators (weekly active users, repeat-purchase rate) when the outcome metric, such as annual revenue, moves too slowly to steer by.`,
      },
    ],
    exercise: {
      prompt: "A subscription app earns an average margin of 200 per customer per month and loses 5% of its customers each month. It spends 1,500 to acquire a customer. Estimate LTV and comment on LTV to CAC.",
      solution: `LTV ≈ monthly margin / monthly churn = 200 / 0.05 = 4,000.
LTV : CAC = 4,000 / 1,500 ≈ 2.7.

The ratio is below the common benchmark of 3, so acquisition is only moderately efficient. Payback takes 1,500 / 200 = 7.5 months. Reducing churn is the strongest lever: at 4% churn, LTV rises to 5,000.`,
    },
  },
  {
    id: "ba-data",
    roles: ["ba", "consulting"],
    topic: "Data Interpretation",
    title: "Data Interpretation: Reading Tables and Charts",
    description: "Avoid the classic traps — base effects, percentages versus percentage points, and averages that hide the story.",
    durationMin: 30,
    difficulty: "Medium",
    objectives: [
      "Calculate growth rates and shares quickly and accurately",
      "Distinguish percent change from percentage-point change",
      "Recognise when a mix shift is driving an average",
      "State an insight, its evidence and its implication",
    ],
    sections: [
      {
        heading: "Growth, share and base effects",
        body: `Percent change = (new − old) / old. The base matters: growing from 10 to 20 is +100%, falling back from 20 to 10 is only −50%.

A small base makes growth look dramatic. A product that grows 80% from 5 crore adds 4 crore; one that grows 10% from 100 crore adds 10 crore. When a question asks which segment "contributed most to growth", compare absolute change, not growth rates.

**Share** = part / total. A segment can grow in absolute terms and still lose share if the total grows faster.`,
      },
      {
        heading: "Percent versus percentage points",
        body: `If conversion moves from 4% to 5%, it rose by **1 percentage point**, which is a **25% increase**. Both statements are correct; mixing them up is one of the most common errors in aptitude tests and in real reports.

Use percentage points for the difference between two rates, and percent for relative change. When you read "margin improved 2%", ask which one is meant.`,
      },
      {
        heading: "Averages and mix shifts",
        body: `An overall average can fall even when every segment improves, if volume shifts toward the lower segment.

Example: metro stores convert at 6% and non-metro stores at 2%. Last year 70% of traffic was metro, giving a blended 4.8%. This year both improve to 6.5% and 2.5%, but metro traffic falls to 40%, so the blend drops to 4.1%.

Always check the mix before concluding that performance worsened. Then report in three parts: the **insight** (what changed), the **evidence** (the numbers), and the **implication** (what should be done).`,
      },
    ],
    exercise: {
      prompt: "A company's revenue was 80 crore last year and 100 crore this year. Its East region went from 20 crore to 23 crore. Did East grow, and what happened to its share?",
      solution: `East grew 15% (3 / 20), but the company grew 25% (20 / 80). East's share fell from 25% (20 / 80) to 23% (23 / 100), a drop of 2 percentage points. East grew in absolute terms while losing share because the rest of the business grew faster.`,
    },
  },
  {
    id: "ba-case",
    roles: ["ba", "consulting"],
    topic: "Case Interviews",
    title: "Analytical Case Interviews",
    description: "A repeatable approach to open business problems: clarify, structure, analyse, recommend.",
    durationMin: 45,
    difficulty: "Hard",
    objectives: [
      "Open a case with clarifying questions that change the analysis",
      "Build an issue tree whose branches do not overlap",
      "Use data requests to test hypotheses, not to fish",
      "Close with a recommendation, its risk and a next step",
    ],
    sections: [
      {
        heading: "Clarify, then structure",
        body: `Start by restating the problem and asking two or three questions that would change your approach: What exactly is the metric and over what period? Is the change across the business or in one segment? What is the objective — diagnose, or decide?

Then lay out a structure before analysing. For "profits fell 15%", a clean first cut is:

~~~
Profit = Revenue - Cost
Revenue = Volume x Price
Cost = Fixed + Variable
~~~

Good branches are mutually exclusive and together cover the problem, so every possible cause lives in exactly one place. Say the structure aloud and ask whether the interviewer wants a particular branch first.`,
      },
      {
        heading: "Work hypothesis-first",
        body: `Do not ask for "all the data". State what you expect and what would confirm it: "If the drop is volume-driven, I would expect orders to be down while average price is flat. Do we have orders by month?"

When numbers arrive:

- Do the arithmetic aloud and round sensibly.
- State what the number means, not just what it is.
- Segment the branch that moved (by product, region, channel, customer type) until the change is isolated.
- Separate internal causes (pricing, product, operations) from external ones (competitors, seasonality, regulation).`,
      },
      {
        heading: "Recommend like an analyst",
        body: `Finish with a short, decision-ready summary:

- **Answer first**: "Profit fell mainly because variable delivery cost per order rose 22% after the logistics partner changed."
- **Evidence**: the two or three numbers that prove it.
- **Recommendation**: a specific action.
- **Risk and next step**: what could make this wrong and what you would check next.

A structured answer with a small arithmetic slip scores better than a correct number with no reasoning. Interviewers are assessing how you think.`,
      },
    ],
    exercise: {
      prompt: "An online grocery company's monthly orders are flat but revenue has dropped 8%. Outline how you would structure the diagnosis.",
      solution: `Revenue = Orders x Average order value. Orders are flat, so AOV must have fallen about 8%.

AOV = items per order x average price per item. Check each:
- Fewer items per order: delivery-fee threshold changes, stock-outs, a shift to quick top-up orders.
- Lower price per item: heavier discounting, mix shift to cheaper categories or private labels.

Segment by customer type (new versus repeat), city and category to isolate where AOV fell, then check what changed internally (pricing, promotions, minimum order value) and externally (a competitor's offer). Recommend based on the isolated driver, and name the guardrail metric you would watch.`,
    },
  },
];
