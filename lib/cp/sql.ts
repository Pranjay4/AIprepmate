"use client";

import { SQL_TABLES } from "./content/sqlData";

// Real SQL execution in the browser using AlaSQL (MIT), loaded on demand from /vendor.
// Each run uses a fresh in-memory database seeded from SQL_TABLES, so learners cannot
// corrupt the data and results are reproducible.

type Row = Record<string, unknown>;
interface AlaDb {
  exec: (sql: string, params?: unknown[]) => unknown;
  tables: Record<string, { data: Row[] }>;
}
interface AlaSql {
  Database: new () => AlaDb;
}

declare global {
  interface Window {
    alasql?: AlaSql;
  }
}

let loading: Promise<AlaSql> | null = null;

export function loadSqlEngine(): Promise<AlaSql> {
  if (typeof window === "undefined") return Promise.reject(new Error("SQL engine is browser-only"));
  if (window.alasql) return Promise.resolve(window.alasql);
  if (!loading) {
    loading = new Promise<AlaSql>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/vendor/alasql.min.js";
      s.async = true;
      s.onload = () => (window.alasql ? resolve(window.alasql) : reject(new Error("SQL engine failed to initialise")));
      s.onerror = () => {
        loading = null;
        reject(new Error("Could not load the SQL engine"));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

function freshDb(engine: AlaSql): AlaDb {
  const db = new engine.Database();
  for (const t of SQL_TABLES) {
    db.exec(`CREATE TABLE ${t.name} (${t.columns.join(", ")})`);
    db.tables[t.name].data = t.rows.map((r) => Object.fromEntries(t.columns.map((c, i) => [c, r[i]])));
  }
  return db;
}

export interface SqlResult {
  columns: string[];
  rows: unknown[][];
}

const FORBIDDEN = /^\s*(insert|update|delete|drop|create|alter|attach|detach|use|truncate)\b/i;

export async function runSql(query: string): Promise<SqlResult> {
  const q = query.trim().replace(/;+\s*$/, "");
  if (!q) throw new Error("Write a query first.");
  if (!/^\s*(select|with)\b/i.test(q) || FORBIDDEN.test(q) || q.includes(";")) {
    throw new Error("Only a single SELECT statement is supported in practice mode.");
  }
  const engine = await loadSqlEngine();
  const db = freshDb(engine);
  let out: unknown;
  try {
    out = db.exec(q);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message.split("\n")[0] : "The query could not be run.");
  }
  if (!Array.isArray(out)) throw new Error("The query did not return a table.");
  const rows = out as Row[];
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { columns, rows: rows.map((r) => columns.map((c) => (r[c] === undefined ? null : r[c]))) };
}

function norm(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "number") return String(Math.round(v * 100) / 100);
  return String(v).trim().toLowerCase();
}

export interface SqlCheck {
  correct: boolean;
  detail: string;
  result?: SqlResult;
  expected?: SqlResult;
}

/** Runs the learner's query and the reference query, then compares the result sets by value. */
export async function checkSql(query: string, solution: string, orderMatters = false): Promise<SqlCheck> {
  const expected = await runSql(solution);
  let result: SqlResult;
  try {
    result = await runSql(query);
  } catch (e) {
    return { correct: false, detail: e instanceof Error ? e.message : "Query error", expected };
  }
  if (result.columns.length !== expected.columns.length && result.rows.length) {
    return {
      correct: false, result, expected,
      detail: `Expected ${expected.columns.length} column(s) but your query returned ${result.columns.length}.`,
    };
  }
  if (result.rows.length !== expected.rows.length) {
    return {
      correct: false, result, expected,
      detail: `Expected ${expected.rows.length} row(s) but your query returned ${result.rows.length}.`,
    };
  }
  const a = result.rows.map((r) => r.map(norm).join("|"));
  const b = expected.rows.map((r) => r.map(norm).join("|"));
  const same = orderMatters ? a.every((x, i) => x === b[i]) : [...a].sort().join("\n") === [...b].sort().join("\n");
  if (same) return { correct: true, result, expected, detail: "Your result matches the expected output." };
  const sameUnordered = [...a].sort().join("\n") === [...b].sort().join("\n");
  return {
    correct: false, result, expected,
    detail: sameUnordered
      ? "The rows are right but the sort order does not match what was asked."
      : "Your query ran, but the values differ from the expected output.",
  };
}
