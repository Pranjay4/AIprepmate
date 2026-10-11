-- CampusPrep — Supabase / PostgreSQL schema
--
-- Mirrors the TypeScript domain model in lib/cp/types.ts. Apply in the Supabase SQL editor
-- or with `supabase db push`. The app currently runs on the local demo repository; this
-- schema is what a Supabase implementation of lib/cp/data/repository.ts should target.
--
-- Access model
--   * Every personal table has row-level security: a user can read and write only rows
--     whose user_id equals auth.uid().
--   * Catalogue tables (roles, modules, questions…) are readable by any signed-in user and
--     writable only with the service role.
--   * Institutions never read personal tables. They can call cohort_metrics(), which
--     returns aggregates only, counts only students who opted in, and suppresses groups
--     smaller than 10.

create extension if not exists "pgcrypto";

-- ───────────────────────── Catalogue (shared content) ─────────────────────────

create table public.roles (
  id          text primary key,              -- 'ba', 'pm', …
  name        text not null,
  blurb       text not null default '',
  depth       text not null default 'starter' check (depth in ('full', 'starter'))
);

create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  role_id     text references public.roles (id) on delete cascade,  -- null = common to all roles
  name        text not null,
  unique (role_id, name)
);

create table public.modules (
  id            text primary key,            -- 'ba-sql-1'
  topic         text not null,
  title         text not null,
  description   text not null,
  duration_min  int  not null check (duration_min > 0),
  difficulty    text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  objectives    text[] not null default '{}',
  exercise      jsonb not null default '{}', -- { prompt, solution }
  external      jsonb not null default '[]', -- [{ label, url }]
  updated_at    timestamptz not null default now()
);

create table public.module_roles (
  module_id text references public.modules (id) on delete cascade,
  role_id   text references public.roles (id) on delete cascade,
  primary key (module_id, role_id)
);

create table public.lessons (
  id         uuid primary key default gen_random_uuid(),
  module_id  text not null references public.modules (id) on delete cascade,
  position   int  not null,
  heading    text not null,
  body       text not null,
  unique (module_id, position)
);

create table public.questions (
  id            text primary key,            -- 'ba-sql-q1'
  topic         text not null,
  difficulty    text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  type          text not null check (type in ('mcq', 'sql', 'short', 'case', 'interview')),
  prompt        text not null,
  explanation   text not null,
  module_id     text references public.modules (id) on delete set null,
  correct_option int,                        -- mcq: index into answer_options.position
  solution_sql  text,                        -- sql: reference query
  order_matters boolean not null default false,
  model_answer  text,                        -- written questions
  key_points    jsonb not null default '[]', -- [{ label, any: [terms] }]
  updated_at    timestamptz not null default now()
);

create table public.question_roles (
  question_id text references public.questions (id) on delete cascade,
  role_id     text references public.roles (id) on delete cascade,
  primary key (question_id, role_id)
);

create table public.answer_options (
  question_id text not null references public.questions (id) on delete cascade,
  position    int  not null,
  label       text not null,
  primary key (question_id, position)
);

create table public.interview_questions (
  id         text primary key,
  role_id    text references public.roles (id) on delete cascade,   -- null = all roles
  type       text not null check (type in ('hr', 'behavioural', 'technical', 'case', 'role')),
  prompt     text not null,
  keywords   text[] not null default '{}',
  follow_up  text not null,
  tip        text not null
);

create index questions_topic_idx on public.questions (topic, difficulty, type);
create index questions_module_idx on public.questions (module_id);
create index lessons_module_idx on public.lessons (module_id, position);

-- ───────────────────────── Institutions ─────────────────────────

create table public.institutions (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

-- Staff who may see aggregated cohort metrics for an institution.
create table public.institution_staff (
  institution_id uuid references public.institutions (id) on delete cascade,
  user_id        uuid references auth.users (id) on delete cascade,
  primary key (institution_id, user_id)
);

-- ───────────────────────── Personal data ─────────────────────────

create table public.profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  name             text not null,
  institution_id   uuid references public.institutions (id) on delete set null,
  institution_name text not null default '',
  degree           text not null default '',
  grad_year        int,
  primary_role     text references public.roles (id),
  timeline_weeks   int  not null default 4 check (timeline_weeks in (2, 4, 8, 12)),
  minutes_per_day  int  not null default 60 check (minutes_per_day between 15 and 480),
  onboarded        boolean not null default false,
  theme            text not null default 'system' check (theme in ('light', 'dark', 'system')),
  share_aggregates boolean not null default false,   -- consent for cohort aggregates
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.target_roles (
  user_id  uuid references auth.users (id) on delete cascade,
  role_id  text references public.roles (id) on delete cascade,
  primary key (user_id, role_id)
);

create table public.roadmaps (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  role_id          text not null references public.roles (id),
  weeks            int  not null check (weeks in (2, 4, 8, 12)),
  minutes_per_day  int  not null,
  start_date       date not null,
  dropped_count    int  not null default 0,
  is_active        boolean not null default true,
  generated_at     timestamptz not null default now()
);
create unique index roadmaps_one_active_idx on public.roadmaps (user_id) where is_active;

create table public.roadmap_tasks (
  id             uuid primary key default gen_random_uuid(),
  roadmap_id     uuid not null references public.roadmaps (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  template_key   text not null,
  week           int  not null,
  due_date       date not null,
  phase          text not null,
  title          text not null,
  description    text not null,
  topic          text not null,
  difficulty     text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  duration_min   int  not null,
  objective      text not null,
  notes          text[] not null default '{}',
  module_id      text references public.modules (id) on delete set null,
  practice       jsonb,                      -- { topics, count, types, timed }
  interview_type text check (interview_type in ('hr', 'behavioural', 'technical', 'case', 'role')),
  status         text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  score          int check (score between 0 and 100),
  started_at     timestamptz,
  completed_at   timestamptz,
  unique (roadmap_id, template_key)
);
create index roadmap_tasks_user_idx on public.roadmap_tasks (user_id, status, due_date);

create table public.module_progress (
  user_id       uuid references auth.users (id) on delete cascade,
  module_id     text references public.modules (id) on delete cascade,
  status        text not null default 'in_progress' check (status in ('not_started', 'in_progress', 'completed')),
  quiz_score    int check (quiz_score between 0 and 100),
  started_at    timestamptz,
  completed_at  timestamptz,
  primary key (user_id, module_id)
);

create table public.practice_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null,
  source_type    text not null check (source_type in ('bank', 'module', 'task', 'baseline', 'saved')),
  source_id      text,
  role_id        text references public.roles (id),
  duration_sec   int  not null default 0,
  time_limit_sec int,
  score_pct      int  not null check (score_pct between 0 and 100),
  created_at     timestamptz not null default now()
);
create index practice_attempts_user_idx on public.practice_attempts (user_id, created_at desc);

create table public.practice_responses (
  id           uuid primary key default gen_random_uuid(),
  attempt_id   uuid not null references public.practice_attempts (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  question_id  text not null references public.questions (id),
  topic        text not null,
  answer       jsonb,                        -- option index, SQL text or written answer; null = skipped
  is_correct   boolean not null,
  score        numeric(4, 3) not null check (score between 0 and 1),
  detail       text,
  matched      text[] not null default '{}'
);
create index practice_responses_user_topic_idx on public.practice_responses (user_id, topic);
create index practice_responses_attempt_idx on public.practice_responses (attempt_id);

create table public.mock_interviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  role_id       text not null references public.roles (id),
  type          text not null check (type in ('hr', 'behavioural', 'technical', 'case', 'role')),
  overall       int  not null check (overall between 0 and 100),
  duration_sec  int  not null default 0,
  task_id       uuid references public.roadmap_tasks (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index mock_interviews_user_idx on public.mock_interviews (user_id, created_at desc);

create table public.interview_answers (
  id            uuid primary key default gen_random_uuid(),
  interview_id  uuid not null references public.mock_interviews (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  question_id   text not null references public.interview_questions (id),
  position      int  not null,
  answer        text not null default '',
  score         int  not null check (score between 0 and 100),
  rubric        jsonb not null               -- [{ key, label, score, signals }]
);

create table public.scorecards (
  interview_id     uuid primary key references public.mock_interviews (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  rubric           jsonb not null,           -- [{ key, label, score }]
  strengths        text[] not null default '{}',
  improvements     text[] not null default '{}',
  recommendations  text[] not null default '{}',
  follow_ups       text[] not null default '{}',
  ai_feedback      jsonb                     -- optional, labelled as AI-generated in the UI
);

create table public.saved_questions (
  user_id      uuid references auth.users (id) on delete cascade,
  question_id  text references public.questions (id) on delete cascade,
  saved_at     timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- Progress records: one row per logged study activity (drives streaks and study time).
create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('task', 'module', 'practice', 'interview', 'roadmap', 'account')),
  label       text not null,
  minutes     int  not null default 0 check (minutes >= 0),
  href        text,
  created_at  timestamptz not null default now()
);
create index activity_log_user_idx on public.activity_log (user_id, created_at desc);

create table public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  props       jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index analytics_events_user_idx on public.analytics_events (user_id, name, created_at desc);

create table public.feedback_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('content', 'support')),
  subject     text not null,
  message     text not null,
  ref         text,                          -- 'module:<id>' or 'question:<id>'
  status      text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at  timestamptz not null default now()
);

-- ───────────────────────── Row-level security ─────────────────────────

-- Catalogue: read-only for signed-in users.
do $$
declare t text;
begin
  foreach t in array array['roles', 'topics', 'modules', 'module_roles', 'lessons', 'questions',
                           'question_roles', 'answer_options', 'interview_questions', 'institutions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "catalogue is readable" on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;

-- Personal tables: owner-only for every operation.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'target_roles', 'roadmaps', 'roadmap_tasks', 'module_progress',
                           'practice_attempts', 'practice_responses', 'mock_interviews', 'interview_answers',
                           'scorecards', 'saved_questions', 'activity_log', 'analytics_events', 'feedback_reports']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "owner can do everything" on public.%I for all to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.institution_staff enable row level security;
create policy "staff can see their own membership" on public.institution_staff
  for select to authenticated using (user_id = auth.uid());

-- ───────────────────────── Institutional aggregates ─────────────────────────
-- The only path from institutional staff to student data. It returns aggregates,
-- counts only students with share_aggregates = true, and returns nothing for groups
-- smaller than 10. There is deliberately no function that returns individual rows.

create or replace function public.cohort_metrics(p_institution uuid)
returns table (
  role_id                 text,
  students                bigint,
  activated               bigint,
  active_last_7_days      bigint,
  planned_task_completion numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with allowed as (
    select 1 from public.institution_staff s
    where s.institution_id = p_institution and s.user_id = auth.uid()
  ),
  cohort as (
    select p.user_id, p.primary_role
    from public.profiles p
    where p.institution_id = p_institution
      and p.share_aggregates
      and exists (select 1 from allowed)
  ),
  per_student as (
    select
      c.user_id,
      c.primary_role,
      exists (select 1 from public.roadmap_tasks t where t.user_id = c.user_id and t.status = 'completed') as activated,
      exists (select 1 from public.activity_log a where a.user_id = c.user_id and a.created_at > now() - interval '7 days') as active_recent,
      (select count(*) filter (where t.status = 'completed')::numeric / nullif(count(*), 0)
         from public.roadmap_tasks t
         join public.roadmaps r on r.id = t.roadmap_id and r.is_active
        where t.user_id = c.user_id and t.due_date <= current_date) as completion
    from cohort c
  )
  select
    primary_role,
    count(*),
    count(*) filter (where activated),
    count(*) filter (where active_recent),
    round(avg(completion) * 100, 1)
  from per_student
  group by primary_role
  having count(*) >= 10;
$$;

revoke all on function public.cohort_metrics(uuid) from public;
grant execute on function public.cohort_metrics(uuid) to authenticated;
