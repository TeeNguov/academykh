const API_BASE_URL = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

async function errorMessageFromResponse(response: Response) {
  const fallback = `API request failed: ${response.status}`;
  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await response.json().catch(() => null) as { message?: unknown; error?: unknown } | null;
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
    return fallback;
  }

  const message = await response.text().catch(() => "");
  return message || fallback;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await errorMessageFromResponse(response));
  }

  return response.json() as Promise<T>;
}

export type ApiCourse = {
  id: number;
  title: string;
  language: string;
  level: string;
  published: boolean;
  createdById?: number | null;
  moduleCount?: number;
  lessonCount?: number;
};

export type LessonType = "RICH_TEXT" | "CODE";

export type ApiLessonBlock = {
  id: number;
  title: string;
  content: string;
  position: number;
  published: boolean;
  type: LessonType;
  codeLanguage: string | null;
};

export type ApiCourseModule = {
  id: number;
  title: string;
  position: number;
  lessons: ApiLessonBlock[];
};

export type ApiCourseDetail = ApiCourse & {
  modules: ApiCourseModule[];
};

export type ApiCourseEnrollment = {
  id: number;
  studentId: number;
  name: string;
  email: string;
  enrolledAt: string;
};

export type ApiCourseShareLink = {
  id: number;
  token: string;
  label: string;
  courseId: number;
  courseTitle: string;
  expiresAt: string;
  active: boolean;
  createdAt: string;
  expired: boolean;
};

export type ApiCourseAccess = {
  course: ApiCourse;
  students: ApiCourseEnrollment[];
  shareLinks: ApiCourseShareLink[];
  enrolled?: string[];
  alreadyEnrolled?: string[];
  notFound?: string[];
  owners?: string[];
};

export type ApiCourseShareLinkDetail = {
  course: ApiCourse;
  shareLink: ApiCourseShareLink;
};

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "OPEN_ENDED" | "CODING";
export type StudentIdentityMode = "REQUIRE_LOGIN" | "NAME_INPUT" | "ANONYMOUS";
export type UserRole = "TEACHER" | "STUDENT";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  authenticated?: boolean;
};

export type ApiPlatformStats = {
  students: number;
  teachers: number;
  attempts: number;
};

export type ApiOption = {
  id: number;
  label: string;
  position: number;
  correct?: boolean;
};

export type ApiQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  points: number;
  position: number;
  options: ApiOption[];
};

export type ApiQuizSummary = {
  id: number;
  title: string;
  exam: boolean;
  durationMinutes: number | null;
  studentIdentityMode: StudentIdentityMode;
  published: boolean;
  questionCount: number;
  totalPoints: number;
};

export type ApiQuizDetail = ApiQuizSummary & {
  questions: ApiQuestion[];
};

export type ApiAttemptAnswer = {
  id: number;
  questionId: number;
  type: QuestionType;
  prompt: string;
  points: number;
  answerText: string | null;
  selectedOptionIds: number[];
  selectedOptions: ApiOption[];
  awardedPoints: number | null;
  feedback: string | null;
  requiresManualGrading: boolean;
};

export type ApiAttempt = {
  id: number;
  testId: number;
  testTitle: string;
  studentName: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  scorePercent: number | null;
  earnedPoints: number;
  totalPoints: number;
  startedAt: string;
  submittedAt: string | null;
  shareLinkId?: number;
};

export type ApiAttemptDetail = ApiAttempt & {
  canViewDetails?: boolean;
  answers: ApiAttemptAnswer[];
};

export type ApiTeacherStudent = {
  id: number | null;
  name: string;
  email: string | null;
  source: string;
  attemptCount: number;
  lastAttemptAt: string;
  tests: string[];
};

export type ApiShareLink = {
  id: number;
  token: string;
  label: string;
  testId: number;
  testTitle: string;
  availableFrom: string | null;
  expiresAt: string;
  active: boolean;
  createdAt: string;
  expired: boolean;
  maxAttempts: number;
  allowStudentReview: boolean;
  simpleMode: boolean;
  invitedEmails: string[];
  invitedGroupIds: number[];
};

export type ApiStudentGroup = {
  id: number;
  name: string;
  emails: string[];
  studentCount: number;
  createdAt: string;
};

export type ApiSharedQuiz = ApiQuizDetail & {
  shareLink: ApiShareLink;
};

export type ApiStartedSharedTest = {
  test: ApiQuizDetail;
  shareLink: ApiShareLink;
  attempt: ApiAttempt;
};

export async function getCourses() {
  return apiFetch<ApiCourse[]>("/api/courses");
}

export async function createCourse(body: unknown) {
  return apiFetch<ApiCourse>("/api/courses", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function getCourse(id: string | number) {
  return apiFetch<ApiCourseDetail>(`/api/courses/${id}`);
}

export async function getCourseAccess(courseId: string | number) {
  return apiFetch<ApiCourseAccess>(`/api/courses/${courseId}/access`);
}

export async function enrollCourseStudents(courseId: string | number, body: unknown) {
  return apiFetch<ApiCourseAccess>(`/api/courses/${courseId}/enrollments`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function removeCourseEnrollment(courseId: string | number, enrollmentId: string | number) {
  return apiFetch<ApiCourseAccess>(`/api/courses/${courseId}/enrollments/${enrollmentId}`, {
    method: "DELETE"
  });
}

export async function createCourseShareLink(courseId: string | number, body: unknown) {
  return apiFetch<ApiCourseShareLink>(`/api/courses/${courseId}/share/links`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function getCourseShareLink(token: string) {
  return apiFetch<ApiCourseShareLinkDetail>(`/api/courses/share/links/${token}`);
}

export async function claimCourseShareLink(token: string) {
  return apiFetch<ApiCourseShareLinkDetail & { course: ApiCourseDetail }>(`/api/courses/share/links/${token}/join`, {
    method: "POST"
  });
}

export async function createCourseModule(courseId: string | number, body: unknown) {
  return apiFetch<ApiCourseDetail>(`/api/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateCourseModule(courseId: string | number, moduleId: string | number, body: unknown) {
  return apiFetch<ApiCourseDetail>(`/api/courses/${courseId}/modules/${moduleId}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

export async function reorderCourseModules(courseId: string | number, moduleIds: Array<string | number>) {
  return apiFetch<ApiCourseDetail>(`/api/courses/${courseId}/modules/reorder`, {
    method: "PUT",
    body: JSON.stringify({ moduleIds })
  });
}

export async function registerUser(body: unknown) {
  return apiFetch<ApiUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function getMe() {
  return apiFetch<ApiUser & { authenticated?: boolean }>("/api/auth/me");
}

export async function getPlatformStats() {
  return apiFetch<ApiPlatformStats>("/api/platform/stats");
}

export async function loginUser(body: unknown) {
  return apiFetch<ApiUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function requestPasswordReset(body: unknown) {
  return apiFetch<{ message: string }>("/api/auth/password/reset/request", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function confirmPasswordReset(body: unknown) {
  return apiFetch<{ message: string }>("/api/auth/password/reset/confirm", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function logoutUser() {
  return apiFetch<{ status: string }>("/api/auth/logout", {
    method: "POST"
  });
}

export async function getQuizzes() {
  return apiFetch<ApiQuizSummary[]>("/api/tests");
}

export async function getQuiz(id: string | number) {
  return apiFetch<ApiQuizDetail>(`/api/tests/${id}`);
}

export async function getQuizForEditing(id: string | number) {
  return apiFetch<ApiQuizDetail>(`/api/admin/tests/${id}`);
}

export async function createQuiz(body: unknown) {
  return apiFetch<ApiQuizDetail>("/api/tests", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function updateQuiz(id: string | number, body: unknown) {
  return apiFetch<ApiQuizDetail>(`/api/tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

export async function getShareLinks() {
  return apiFetch<ApiShareLink[]>("/api/admin/share/links");
}

export async function createShareLink(testId: string | number, body: unknown) {
  return apiFetch<ApiShareLink>(`/api/tests/${testId}/share/links`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function revokeShareLink(shareLinkId: string | number) {
  return apiFetch<ApiShareLink>(`/api/admin/share/links/${shareLinkId}/revoke`, {
    method: "POST"
  });
}

export async function getStudentGroups() {
  return apiFetch<ApiStudentGroup[]>("/api/admin/student/groups");
}

export async function createStudentGroup(body: unknown) {
  return apiFetch<ApiStudentGroup>("/api/admin/student/groups", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function getSharedQuiz(token: string) {
  return apiFetch<ApiSharedQuiz>(`/api/share/links/${token}`);
}

export async function startSharedAttempt(token: string, body: unknown) {
  return apiFetch<ApiStartedSharedTest>(`/api/share/links/${token}/start`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function submitSharedAttempt(token: string, attemptId: string | number, body: unknown) {
  return apiFetch<ApiAttemptDetail>(`/api/share/links/${token}/attempts/${attemptId}/submit`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function submitAttempt(testId: string | number, body: unknown) {
  return apiFetch<ApiAttemptDetail>(`/api/tests/${testId}/attempts`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function getAttempts() {
  return apiFetch<ApiAttempt[]>("/api/attempts");
}

export async function getAttempt(id: string | number) {
  return apiFetch<ApiAttemptDetail>(`/api/attempts/${id}`);
}

export async function gradeAttempt(id: string | number, body: unknown) {
  return apiFetch<ApiAttemptDetail>(`/api/attempts/${id}/grade`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export async function completeAttempt(id: string | number) {
  return apiFetch<ApiAttemptDetail>(`/api/attempts/${id}/complete`, {
    method: "POST"
  });
}
