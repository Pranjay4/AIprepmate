import type { UserData } from "../types";
import { uid } from "../util";
import { RepoError, type AuthUser, type Repository } from "./repository";

// Local demo repository: everything lives in this browser's localStorage.
// Passwords are salted and hashed with SHA-256 so they are not stored in plain text,
// but this is demo-grade auth for a single device — not a substitute for a real auth service.

const NS = "campusprep.v1";
const ACCOUNTS = `${NS}.accounts`;
const SESSION = `${NS}.session`;
const userKey = (id: string) => `${NS}.user.${id}`;

interface Account extends AuthUser {
  salt: string;
  hash: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new RepoError("Could not save to this browser's storage. It may be full or blocked.");
  }
}

async function hash(password: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  if (window.crypto?.subtle) {
    const buf = await window.crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Non-secure contexts have no SubtleCrypto; fall back to a simple non-cryptographic digest.
  let h = 5381;
  for (const b of bytes) h = ((h << 5) + h + b) | 0;
  return `djb2:${h}`;
}

export const localRepository: Repository = {
  mode: "local-demo",

  async getSessionUserId() {
    return read<string | null>(SESSION, null);
  },

  async setSessionUserId(id) {
    if (id) write(SESSION, id);
    else window.localStorage.removeItem(SESSION);
  },

  async signUp({ name, email, password }) {
    const accounts = read<Account[]>(ACCOUNTS, []);
    const normalised = email.trim().toLowerCase();
    if (accounts.some((a) => a.email === normalised)) {
      throw new RepoError("An account with this email already exists on this device. Try logging in.");
    }
    const salt = uid("s");
    const account: Account = { id: uid("user"), name: name.trim(), email: normalised, salt, hash: await hash(password, salt) };
    write(ACCOUNTS, [...accounts, account]);
    return { id: account.id, name: account.name, email: account.email };
  },

  async signIn(email, password) {
    const accounts = read<Account[]>(ACCOUNTS, []);
    const account = accounts.find((a) => a.email === email.trim().toLowerCase());
    if (!account || account.hash !== (await hash(password, account.salt))) {
      throw new RepoError("Email or password is incorrect.");
    }
    return { id: account.id, name: account.name, email: account.email };
  },

  async loadUser(id) {
    return read<UserData | null>(userKey(id), null);
  },

  async saveUser(id, data) {
    write(userKey(id), data);
  },

  async deleteUser(id) {
    window.localStorage.removeItem(userKey(id));
    write(ACCOUNTS, read<Account[]>(ACCOUNTS, []).filter((a) => a.id !== id));
  },
};
