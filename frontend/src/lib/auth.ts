import { cookies } from "next/headers";
import { ApiUser } from "@/lib/api";

const API_BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function getCurrentUser(): Promise<ApiUser | null> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {}
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const user = await response.json() as Partial<ApiUser> & { authenticated?: boolean };
  return user.authenticated === false || !user.id ? null : user as ApiUser;
}

export async function isTeacher() {
  const user = await getCurrentUser();
  return user?.role === "TEACHER";
}
