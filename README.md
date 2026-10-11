# CampusPrep

**Prepare with direction. Practise with purpose. Progress with confidence.**

CampusPrep turns a target job role into a structured weekly preparation plan for campus
placements: curated lessons, a practice bank with real feedback, rubric-scored mock
interviews, progress tracking and a rule-based "what should I do next?" engine.

It runs with **no configuration** in demo mode. The original GDiscuss group-discussion
simulator is kept as a module under `/gd`.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and click **Explore the demo account**, or sign up to build
your own plan. No environment variables are needed.

```bash
npm run build   # production build
npm run lint
```

## What works in demo mode, and what needs credentials

| Area | Demo mode (no keys) | Needs credentials |
| --- | --- | --- |
| Sign up, log in, log out, demo account | ✅ Stored in this browser's `localStorage` | Cross-device accounts need Supabase (not wired yet) |
| Onboarding, role-based roadmap, task workflow, rescheduling | ✅ | — |
| Learning modules and knowledge-check quizzes | ✅ | — |
| Practice bank: MCQ, SQL, written, case, interview questions | ✅ | — |
| SQL questions | ✅ Executed for real in the browser (AlaSQL) and compared with the reference result | — |
| Written-answer marking | ✅ Keyword-based key-point check plus model answer — labelled as not AI | — |
| Mock interviews and scorecards | ✅ Transparent rule-based rubric | Optional "Additional AI feedback" needs an AI provider key |
| Progress, readiness indicator, recommendations | ✅ All derived from stored activity | — |
| Institution dashboard | ✅ Synthetic cohort, clearly labelled | Real cohorts need Supabase |
| Product metrics | ✅ From the signed-in account's own event log | Cross-user rates need a shared backend |
| GD Simulator (`/gd`) | Pages load; starting a discussion fails with a clear message | Requires an AI provider key |

### Honest limitations

- **Supabase is not connected.** The schema, indexes and row-level-security policies are
  written (`supabase/schema.sql`) and the app talks to storage only through a `Repository`
  interface, but the Supabase implementation of that interface has not been built or tested.
- **Demo auth is not production auth.** Passwords are salted and SHA-256 hashed before being
  stored locally so they are not kept in plain text, but everything lives on one device.
- **Content depth varies by role.** Business Analyst and Product Manager have full module
  libraries and question banks. Marketing, Finance, Consulting and Software have starter
  content: a complete roadmap with embedded key points, one or two modules and a smaller
  question set.
- **Rule-based feedback has limits.** The interview rubric and the written-answer check
  count signals in text. They cannot verify facts or judge reasoning quality.
- The readiness indicator is an explainable summary of the learner's own inputs. It does not
  predict placement outcomes.

## Optional: AI feedback

```bash
cp .env.example .env.local
```

Set `AI_PROVIDER` to `anthropic`, `openai` or `gemini` and fill in the matching key. Keys are
read only in server route handlers and never reach the browser.

- Mock-interview scorecards gain a **Generate AI feedback** button
  (`app/api/interview/feedback/route.ts`). Output is validated with Zod; if the provider fails,
  the page shows an error and the rubric scorecard is unaffected. Answers are sent only when the
  learner clicks the button, and the result is labelled as AI-generated.
- The GD Simulator's AI participants start working.

Without a key, nothing in the product is described as AI-powered.

## Moving to Supabase

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Seed the catalogue tables (`roles`, `modules`, `lessons`, `questions`, …) from
   `lib/cp/content/*`.
3. `npm install @supabase/supabase-js`, then add `lib/cp/data/supabase.ts` implementing the
   `Repository` interface from `lib/cp/data/repository.ts` (auth via `supabase.auth`,
   `loadUser`/`saveUser` mapping `UserData` to the personal tables).
4. Return it from `getRepository()` in `lib/cp/data/index.ts` when
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

Pages, the Zustand store and all business logic stay unchanged, because they depend only on
the interface.

**Access model in the schema:** every personal table has an owner-only RLS policy
(`user_id = auth.uid()`). Institutional staff cannot read personal tables at all; they can
only call `cohort_metrics()`, which returns aggregates, counts only students who opted in
(`profiles.share_aggregates`), and suppresses groups smaller than 10.

## Architecture

```
app/
  page.tsx, login/, signup/        Public pages
  onboarding/                      5-step setup: roles → timeline → daily time → baseline → profile
  dashboard/                       "What should I prepare next?"
  roadmap/                         Weekly checklist, calendar view, filters, task dialog, adjust plan
  learn/, learn/[id]/              Module library and lesson with exercise and quiz
  practice/, session/, results/    Practice bank, live session (timer, navigation), review
  interview/, session/, [id]/      Mock interview setup, answering, scorecard
  progress/                        Analytics and readiness indicator
  institution/                     Synthetic cohort view and product metrics
  settings/                        Profile, plan, theme, privacy, data, feedback
  api/interview/feedback/          Optional server-side AI feedback
  gd/                              Existing GD simulator (moved from the site root)
components/
  cp/                              UI kit, charts, plan pickers, recommendation cards
  layout/AppShell.tsx              Auth gating, sidebar, mobile tab bar
lib/cp/
  types.ts                         Domain model (mirrors supabase/schema.sql)
  content/                         Roles, modules, questions, SQL dataset, interview pool, roadmap templates
  roadmap.ts                       Roadmap generation, rescheduling
  grading.ts, sql.ts, rubric.ts    Marking: MCQ and key points, SQL execution, interview rubric
  insights.ts                      Metrics, streak, topic performance, readiness, recommendations
  store.ts                         Zustand store and every state-changing action
  seed.ts                          Demo account builder (records flagged `seeded`)
  cohort.ts                        Deterministic synthetic cohort
  data/                            Repository interface + localStorage implementation
supabase/schema.sql                Tables, indexes, RLS policies, aggregate function
public/vendor/alasql.min.js        SQL engine (MIT), loaded on demand by SQL questions
```

### How the main pieces work

- **Roadmap generation** (`lib/cp/roadmap.ts`). Each role has an ordered list of task
  templates tagged core, standard or stretch. The time budget is
  `weeks × 6 study days × minutes per day`. Core tasks are always included; standard and
  stretch tasks are added while they fit. Tasks keep their teaching order and are spread so
  each week carries a similar load. Plans of 8+ weeks add weekly review sets and fortnightly
  mock interviews when time allows. Adjusting the plan regenerates the schedule and carries
  progress over by task key.
- **Recommendations** (`recommendations()` in `lib/cp/insights.ts`). Rules run in priority
  order: unfinished session → overdue tasks → weak topics in the target role (accuracy below
  60% over 3+ answers) → repeated low behavioural/HR interviews → lesson completed but topic
  never practised → next roadmap task. Every recommendation carries its reason and a link.
- **Readiness** (`readiness()`). Weighted average of roadmap completion (40%), recent practice
  scores (35%) and recent mock interviews (25%). Inputs with no data are excluded and the
  remaining weights re-normalised, so missing data is never scored as zero. At least two
  inputs are required before a score is shown.
- **Interview rubric** (`lib/cp/rubric.ts`). Five dimensions — relevance, structure, evidence,
  analytical depth, communication — each scored 1–5 from countable signals that are listed
  back to the learner on the scorecard.
- **Demo data.** Everything seeded for the demo account is flagged `seeded: true`, shown with
  a "Sample" badge, and can be removed or restored from Settings → Your data.

### Analytics events

`signup_completed`, `onboarding_completed`, `role_selected`, `roadmap_generated`,
`roadmap_viewed`, `task_started`, `task_completed`, `practice_started`, `practice_submitted`,
`feedback_viewed`, `recommendation_followed`, `recommended_task_completed`,
`session_returned`, `content_issue_reported`.

Events are stored with the account and summarised under Institution → Product metrics
(activation, planned-task completion, practice completion, weak-area action rate, return
sessions, and whether the learner counts toward the North Star this week). Nothing is sent to
a third party.

## Notes on the existing GD simulator

The GD pages moved from the site root to `/gd/*` (`/gd`, `/gd/setup`, `/gd/live`,
`/gd/report`, `/gd/sessions`, `/gd/performance`, `/gd/topics`, `/gd/profile`,
`/gd/settings`). Their logic, API routes (`/api/gd/*`, `/api/coach/*`) and storage are
unchanged; GD history is still kept separately in `localStorage`.

## Content

Lessons, questions and model answers are original. The few external links (PostgreSQL docs,
Microsoft Excel support, Khan Academy) are labelled as external on the lesson page. Learners
can flag anything incorrect with **Report an issue** on lessons and question reviews; reports
are listed under Settings → Support and feedback.
