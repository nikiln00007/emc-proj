-- ============================================================
-- Peer Project Hub — Supabase PostgreSQL Schema
-- Run this in Supabase Dashboard: SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  firebase_uid  text unique not null,
  email         text,
  name          text not null default 'Developer',
  profile_image text default '',
  bio           text default '',
  role          text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  department    text,
  subjects      text[],
  can_grade     boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. PROJECTS
-- ────────────────────────────────────────────────────────────
create table if not exists projects (
  id                          text primary key default gen_random_uuid()::text,
  title                       text not null,
  description                 text not null,
  tags                        text[] default '{}',
  github_url                  text not null,
  live_demo_url               text default '',
  owner_uid                   text not null,
  owner_name                  text not null default 'Anonymous',
  owner_image                 text default '',
  likes                       int default 0,
  liked_by                    text[] default '{}',
  bookmarked_by               text[] default '{}',
  average_rating              numeric(3,1) default 0,
  rating_count                int default 0,
  ratings                     jsonb default '[]',
  is_submitted_for_evaluation boolean default false,
  evaluation_status           text default 'not_submitted' check (evaluation_status in ('not_submitted','pending','in_review','graded','needs_revision')),
  submitted_for_evaluation_at timestamptz,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. COMMENTS
-- ────────────────────────────────────────────────────────────
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null references projects(id) on delete cascade,
  user_id     text not null,
  user_name   text not null default 'Anonymous',
  user_image  text default '',
  text        text not null,
  created_at  timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 4. EVALUATIONS
-- ────────────────────────────────────────────────────────────
create table if not exists evaluations (
  id                    uuid primary key default gen_random_uuid(),
  project_id            text not null references projects(id) on delete cascade,
  student_uid           text not null,
  teacher_uid           text,
  teacher_name          text default 'Faculty Evaluator',
  status                text not null default 'pending' check (status in ('pending','in_review','graded','needs_revision')),
  grade                 numeric(4,2),
  letter_grade          text default '',
  rubric                jsonb default '[]',
  feedback              text default '',
  private_notes         text default '',
  submitted_at          timestamptz default now(),
  graded_at             timestamptz,
  revision_requested_at timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique (project_id)
);

-- ────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS) — Enable but allow all for now
-- (Tighten per your auth model later)
-- ────────────────────────────────────────────────────────────
alter table users        enable row level security;
alter table projects     enable row level security;
alter table comments     enable row level security;
alter table evaluations  enable row level security;

-- Allow full access via service/secret key (used by backend only)
create policy "Service role has full access on users"       on users        for all using (true) with check (true);
create policy "Service role has full access on projects"    on projects     for all using (true) with check (true);
create policy "Service role has full access on comments"    on comments     for all using (true) with check (true);
create policy "Service role has full access on evaluations" on evaluations  for all using (true) with check (true);

-- ────────────────────────────────────────────────────────────
-- 6. INDEXES for performance
-- ────────────────────────────────────────────────────────────
create index if not exists idx_projects_owner_uid        on projects(owner_uid);
create index if not exists idx_projects_evaluation_status on projects(evaluation_status);
create index if not exists idx_projects_created_at       on projects(created_at desc);
create index if not exists idx_comments_project_id       on comments(project_id);
create index if not exists idx_evaluations_project_id    on evaluations(project_id);
create index if not exists idx_evaluations_student_uid   on evaluations(student_uid);
create index if not exists idx_users_firebase_uid        on users(firebase_uid);
