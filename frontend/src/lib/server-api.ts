import { cookies } from "next/headers";
import { ApiAttempt, ApiAttemptDetail, ApiCourse, ApiCourseAccess, ApiCourseDetail, ApiCourseShareLinkDetail, ApiPlatformStats, ApiQuizDetail, ApiQuizSummary, ApiShareLink, ApiSharedQuiz, ApiStudentGroup, ApiTeacherStudent } from "@/lib/api";

const API_BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

async function serverApiFetch<T>(path: string): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {}
  });

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await response.json().catch(() => null) as { message?: unknown; error?: unknown } | null;
      if (typeof body?.message === "string" && body.message.trim()) {
        throw new Error(body.message);
      }
      if (typeof body?.error === "string" && body.error.trim()) {
        throw new Error(body.error);
      }
    }
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getServerCourses() {
  return serverApiFetch<ApiCourse[]>("/api/courses");
}

export function getServerCourse(id: string | number) {
  return serverApiFetch<ApiCourseDetail>(`/api/courses/${id}`);
}

export function getServerCourseAccess(id: string | number) {
  return serverApiFetch<ApiCourseAccess>(`/api/courses/${id}/access`);
}

export function getServerCourseShareLink(token: string) {
  return serverApiFetch<ApiCourseShareLinkDetail>(`/api/courses/share/links/${token}`);
}

export function getServerSharedQuiz(token: string) {
  return serverApiFetch<ApiSharedQuiz>(`/api/share/links/${token}`);
}

export function getServerQuizzes() {
  return serverApiFetch<ApiQuizSummary[]>("/api/tests");
}

export function getServerQuizForEditing(id: string | number) {
  return serverApiFetch<ApiQuizDetail>(`/api/admin/tests/${id}`);
}

export function getServerShareLinks() {
  return serverApiFetch<ApiShareLink[]>("/api/admin/share/links");
}

export function getServerShareLinkAttempts(shareLinkId: string | number) {
  return serverApiFetch<ApiAttempt[]>(`/api/admin/share/links/${shareLinkId}/attempts`);
}

export function getServerShareLinkAttempt(shareLinkId: string | number, attemptId: string | number) {
  return serverApiFetch<ApiAttemptDetail>(`/api/admin/share/links/${shareLinkId}/attempts/${attemptId}`);
}

export function getServerAttempts() {
  return serverApiFetch<ApiAttempt[]>("/api/attempts");
}

export function getServerAdminAttempts() {
  return serverApiFetch<ApiAttempt[]>("/api/admin/attempts");
}

export function getServerAttempt(id: string | number) {
  return serverApiFetch<ApiAttemptDetail>(`/api/attempts/${id}`);
}

export function getServerTeacherStudents() {
  return serverApiFetch<ApiTeacherStudent[]>("/api/admin/students");
}

export function getServerStudentGroups() {
  return serverApiFetch<ApiStudentGroup[]>("/api/admin/student/groups");
}

export function getServerPlatformStats() {
  return serverApiFetch<ApiPlatformStats>("/api/platform/stats");
}
