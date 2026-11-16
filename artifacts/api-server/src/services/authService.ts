import { randomBytes, timingSafeEqual } from "node:crypto";

export type UserRole = "admin" | "sales";

export interface SessionUser {
  email: string;
  role: UserRole;
}

interface Account extends SessionUser {
  password: string;
}

interface StoredSession {
  user: SessionUser;
  expiresAt: number;
}

const sessions = new Map<string, StoredSession>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const demoAccounts: Account[] = [
  {
    email: "admin@webwin.demo",
    password: "WebWinAdmin2026!",
    role: "admin",
  },
  {
    email: "sales@webwin.demo",
    password: "WebWinSales2026!",
    role: "sales",
  },
];

// Environment credentials ke saath local-only demo accounts allow karta hai.
function configuredAccounts(): Account[] {
  const environmentAccounts = [
    {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "admin" as const,
    },
    {
      email: process.env.SALES_EMAIL,
      password: process.env.SALES_PASSWORD,
      role: "sales" as const,
    },
  ].filter(
    (account): account is Account =>
      Boolean(account.email?.trim()) && Boolean(account.password),
  );

  return process.env.NODE_ENV === "production"
    ? environmentAccounts
    : [...environmentAccounts, ...demoAccounts];
}

// Password ko constant-time comparison se check karta hai.
function passwordsMatch(expected: string, received: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
}

// Valid credentials se role-aware user identity return karta hai.
export function authenticate(
  email: string,
  password: string,
): SessionUser | null {
  const account = configuredAccounts().find(
    (candidate) =>
      candidate.email.toLowerCase() === email.trim().toLowerCase() &&
      passwordsMatch(candidate.password, password),
  );

  return account ? { email: account.email, role: account.role } : null;
}

// Random session ID ko server memory me limited lifetime ke saath store karta hai.
export function createSession(user: SessionUser): string {
  const sessionId = randomBytes(32).toString("hex");
  sessions.set(sessionId, { user, expiresAt: Date.now() + SESSION_TTL_MS });
  return sessionId;
}

// Cookie session ko validate karke expired session hata deta hai.
export function findSession(sessionId: string | undefined): SessionUser | null {
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return session.user;
}

// Logout par server-side session invalidate karta hai.
export function deleteSession(sessionId: string | undefined): void {
  if (sessionId) sessions.delete(sessionId);
}

// Development login hints dikhata hai, production me demo credentials kabhi enable nahi karta.
export function isDemoLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}