import type { UserData } from "../types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Persistence boundary. The UI and store only talk to this interface, so the local
 * demo implementation can be replaced by a Supabase-backed one (see supabase/schema.sql
 * and README) without changing pages or business logic. All methods are async for that reason.
 */
export interface Repository {
  readonly mode: "local-demo" | "supabase";
  getSessionUserId(): Promise<string | null>;
  setSessionUserId(id: string | null): Promise<void>;
  signUp(input: { name: string; email: string; password: string }): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  loadUser(id: string): Promise<UserData | null>;
  saveUser(id: string, data: UserData): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

export class RepoError extends Error {}
