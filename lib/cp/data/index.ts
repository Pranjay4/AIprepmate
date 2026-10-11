import { localRepository } from "./local";
import type { Repository } from "./repository";

/**
 * Single place where the persistence backend is chosen.
 * To move to Supabase: implement `Repository` in ./supabase.ts against the tables in
 * supabase/schema.sql and return it here when NEXT_PUBLIC_SUPABASE_URL is set.
 */
export function getRepository(): Repository {
  return localRepository;
}

export const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
