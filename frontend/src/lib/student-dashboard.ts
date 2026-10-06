import { cookies } from "next/headers";
import { ApiCourse, ApiUser } from "@/lib/api";

const API_BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type ApiDashboardSharedTest = {
  id: number;
  token: string;
  label: string;
  testId: number;
  testTitle: string;
  expiresAt: string;
  durationMinutes: number | null;
  questionCount: number;
  courseId: number | null;
  courseTitle: string | null;
  invitedGroupIds: number[];
};

export type ApiDashboardAttempt = {
  id: number;
  testId: number;
  testTitle: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  scorePercent: number | null;
  startedAt: string;
  submittedAt: string | null;
  shareLinkId?: number;
  courseId: number | null;
  courseTitle: string | null;
  invitedGroupIds?: number[];
};

export type ApiStudentDashboard = {
  user: ApiUser;
  stats: {
    enrolledCourses: number;
    sharedTests: number;
    attempts: number;
    averageScore: number;
  };
  enrolledCourses: ApiCourse[];
  sharedTests: ApiDashboardSharedTest[];
  attempts: ApiDashboardAttempt[];
};

export async function getStudentDashboard() {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${API_BASE_URL}/api/me/dashboard`, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {}
  });

  if (!response.ok) {
    throw new Error("Dashboard is not available.");
  }

  return response.json() as Promise<ApiStudentDashboard>;
}
