import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("Missing SESSION_SECRET env var");
}

const EMP_COOKIE = "emp_session";
const ADMIN_COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen

function sign(value: string): string {
  const sig = createHmac("sha256", SECRET!).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verify(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", SECRET!).update(value).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return value;
  } catch {
    return null;
  }
}

export async function setEmployeeSession(loginCode: string) {
  const jar = await cookies();
  jar.set(EMP_COOKIE, sign(loginCode), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getEmployeeSession(): Promise<string | null> {
  const jar = await cookies();
  return verify(jar.get(EMP_COOKIE)?.value);
}

export async function clearEmployeeSession() {
  const jar = await cookies();
  jar.delete(EMP_COOKIE);
}

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sign("admin"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verify(jar.get(ADMIN_COOKIE)?.value) === "admin";
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
