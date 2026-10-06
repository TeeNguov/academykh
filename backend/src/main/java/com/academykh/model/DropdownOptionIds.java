package com.academykh.model;

public final class DropdownOptionIds {
    public static final long ROLE_STUDENT = 1001L;
    public static final long ROLE_TEACHER = 1002L;

    public static final long ATTEMPT_IN_PROGRESS = 2001L;
    public static final long ATTEMPT_SUBMITTED = 2002L;
    public static final long ATTEMPT_GRADED = 2003L;

    public static final long LESSON_RICH_TEXT = 3001L;
    public static final long LESSON_CODE = 3002L;

    public static final long QUESTION_SINGLE_CHOICE = 4001L;
    public static final long QUESTION_MULTIPLE_CHOICE = 4002L;
    public static final long QUESTION_OPEN_ENDED = 4003L;
    public static final long QUESTION_CODING = 4004L;

    public static final long STUDENT_IDENTITY_REQUIRE_LOGIN = 5001L;
    public static final long STUDENT_IDENTITY_NAME_INPUT = 5002L;
    public static final long STUDENT_IDENTITY_ANONYMOUS = 5003L;

    private DropdownOptionIds() {
    }
}
