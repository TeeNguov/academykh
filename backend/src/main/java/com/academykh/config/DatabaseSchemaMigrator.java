package com.academykh.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.database-migrator", name = "enabled", havingValue = "true")
@Order(0)
public class DatabaseSchemaMigrator implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        createDropdownTablesIfMissing();
        seedSystemDropdownOptions();
        addColumnIfMissing("test_attempts", "status_option_id", "bigint not null default 2001");
        migrateLegacySingularTables();
        jdbcTemplate.execute("alter table questions modify prompt longtext not null");
        jdbcTemplate.execute("alter table questions modify explanation longtext null");
        addColumnIfMissing("questions", "type", "varchar(32) not null default 'OPEN_ENDED'");
        jdbcTemplate.execute("alter table questions modify type varchar(32) not null default 'OPEN_ENDED'");
        addColumnIfMissing("questions", "type_option_id", "bigint null");
        addColumnIfMissing("question_options", "archived", "bit not null default 0");
        addColumnIfMissing("tests", "student_identity_mode", "varchar(32) null");
        addColumnIfMissing("tests", "student_identity_option_id", "bigint null");
        addColumnIfMissing("lessons", "type", "varchar(24) not null default 'RICH_TEXT'");
        addColumnIfMissing("lessons", "type_option_id", "bigint null");
        addColumnIfMissing("lessons", "code_language", "varchar(80) null");
        jdbcTemplate.execute("alter table lessons modify content longtext not null");
        addColumnIfMissing("users", "role", "varchar(24) not null default 'STUDENT'");
        jdbcTemplate.execute("alter table users modify role varchar(24) not null default 'STUDENT'");
        addColumnIfMissing("users", "role_option_id", "bigint null");
        addColumnIfMissing("questions", "test_id", "bigint null");
        addColumnIfMissing("test_share_links", "test_id", "bigint null");
        backfillAttemptStatusOptions();
        dropColumnIfExists("test_attempts", "status");
        jdbcTemplate.execute("alter table test_attempts modify status_option_id bigint not null default 2001");
        addColumnIfMissing("test_share_links", "allow_student_review", "bit not null default 0");
        addColumnIfMissing("test_share_links", "simple_mode", "bit not null default 0");
        addColumnIfMissing("test_share_links", "invited_emails", "longtext null");
        addColumnIfMissing("test_share_links", "invited_group_ids", "longtext null");
        backfillRenamedTestColumns();
        createStudentGroupTablesIfMissing();
        createCourseShareLinkTableIfMissing();
        backfillDropdownBackedColumns();
    }

    private void migrateLegacySingularTables() {
        normalizeLegacyTablesIfPresent();
        copyTableIfPossible("course", "courses", "id, title, language, level, published, created_at, created_by_id");
        copyTableIfPossible("course_module", "course_modules", "id, title, position, course_id");
        copyTableIfPossible("lesson", "lessons", "id, title, content, position, published, type, code_language, module_id");
        copyTableIfPossible("course_enrollment", "course_enrollments", "id, enrolled_at, student_id, course_id");
        copyTableIfPossible("coding_challenge", "coding_challenges", "id, title, language, difficulty, prompt, starter_code, published, course_id, created_by_id");
        copyTableIfPossible("code_submission", "code_submissions", "id, language, source_code, status, submitted_at, student_id, challenge_id");
        copyTableIfPossible("quiz", "tests", "id, title, exam, duration_minutes, student_identity_mode, published, course_id, created_by_id");
        copyTableIfPossible("quizzes", "tests", "id, title, exam, duration_minutes, student_identity_mode, published, course_id, created_by_id");
        copyTableIfPossible("question", "questions", "id, type, prompt, explanation, position, points, archived, test_id", "id, type, prompt, explanation, position, points, archived, quiz_id");
        copyTableIfPossible("question_option", "question_options", "id, label, correct, position, question_id");
        copyTableIfPossible("test_share_link", "test_share_links", "id, token, label, available_from, expires_at, active, max_attempts, created_at, test_id", "id, token, label, available_from, expires_at, active, max_attempts, created_at, quiz_id");
        copyTableIfPossible(
            "quiz_attempt",
            "test_attempts",
            "id, student_name, status_option_id, score_percent, started_at, submitted_at, student_id, test_id, share_link_id",
            "id, student_name, case upper(coalesce(status, 'IN_PROGRESS')) when 'SUBMITTED' then 2002 when 'GRADED' then 2003 else 2001 end, score_percent, started_at, submitted_at, student_id, quiz_id, share_link_id"
        );
        copyTableIfPossible(
            "quiz_attempts",
            "test_attempts",
            "id, student_name, status_option_id, score_percent, started_at, submitted_at, student_id, test_id, share_link_id",
            "id, student_name, case upper(coalesce(status, 'IN_PROGRESS')) when 'SUBMITTED' then 2002 when 'GRADED' then 2003 else 2001 end, score_percent, started_at, submitted_at, student_id, quiz_id, share_link_id"
        );
        copyTableIfPossible("attempt_answer", "attempt_answers", "id, answer_text, selected_option_ids, awarded_points, feedback, requires_manual_grading, attempt_id, question_id");
    }

    private void normalizeLegacyTablesIfPresent() {
        if (tableExists("lesson")) {
            addColumnIfMissing("lesson", "type", "varchar(24) not null default 'RICH_TEXT'");
            addColumnIfMissing("lesson", "code_language", "varchar(80) null");
        }
        if (tableExists("question")) {
            addColumnIfMissing("question", "archived", "bit not null default 0");
            jdbcTemplate.execute("alter table question modify prompt longtext not null");
            jdbcTemplate.execute("alter table question modify explanation longtext null");
        }
    }

    private void copyTableIfPossible(String legacyTableName, String tableName, String columns) {
        copyTableIfPossible(legacyTableName, tableName, columns, columns);
    }

    private void copyTableIfPossible(String legacyTableName, String tableName, String targetColumns, String sourceColumns) {
        if (!tableExists(legacyTableName) || !tableExists(tableName) || tableHasRows(tableName)) {
            return;
        }

        jdbcTemplate.execute("insert ignore into " + tableName + " (" + targetColumns + ") select " + sourceColumns + " from " + legacyTableName);
    }

    private void createDropdownTablesIfMissing() {
        if (!tableExists("dropdowns")) {
            jdbcTemplate.execute("""
                create table dropdowns (
                  id bigint not null auto_increment,
                  name varchar(120) not null,
                  label varchar(180) not null,
                  description longtext null,
                  created_at datetime(6) not null,
                  created_by_id bigint null,
                  primary key (id),
                  unique key uk_dropdowns_name (name),
                  key idx_dropdowns_created_by (created_by_id),
                  constraint fk_dropdowns_created_by foreign key (created_by_id) references users (id)
                ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci
                """);
        }

        if (!tableExists("dropdown_options")) {
            jdbcTemplate.execute("""
                create table dropdown_options (
                  id bigint not null auto_increment,
                  label varchar(180) not null,
                  value varchar(180) not null,
                  position int not null,
                  active bit not null,
                  dropdown_id bigint null,
                  primary key (id),
                  key idx_dropdown_options_dropdown (dropdown_id),
                  constraint fk_dropdown_options_dropdown foreign key (dropdown_id) references dropdowns (id)
                ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci
                """);
        }
    }

    private void createStudentGroupTablesIfMissing() {
        if (!tableExists("student_groups")) {
            jdbcTemplate.execute("""
                create table student_groups (
                  id bigint not null auto_increment,
                  name varchar(180) not null,
                  created_at datetime(6) not null,
                  created_by_id bigint null,
                  primary key (id),
                  key idx_student_groups_created_by (created_by_id),
                  constraint fk_student_groups_created_by foreign key (created_by_id) references users (id)
                ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci
                """);
        }
        if (!tableExists("student_group_members")) {
            jdbcTemplate.execute("""
                create table student_group_members (
                  id bigint not null auto_increment,
                  email varchar(160) not null,
                  group_id bigint null,
                  primary key (id),
                  key idx_student_group_members_group (group_id),
                  key idx_student_group_members_email (email),
                  constraint fk_student_group_members_group foreign key (group_id) references student_groups (id)
                ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci
                """);
        }
    }

    private void createCourseShareLinkTableIfMissing() {
        if (!tableExists("course_share_links")) {
            jdbcTemplate.execute("""
                create table course_share_links (
                  id bigint not null auto_increment,
                  token varchar(80) not null,
                  label varchar(180) not null,
                  expires_at datetime(6) not null,
                  active bit not null,
                  created_at datetime(6) not null,
                  course_id bigint null,
                  primary key (id),
                  unique key uk_course_share_links_token (token),
                  key idx_course_share_links_course (course_id),
                  constraint fk_course_share_links_course foreign key (course_id) references courses (id)
                ) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci
                """);
        }
    }

    private void seedSystemDropdownOptions() {
        jdbcTemplate.update("""
            insert ignore into dropdowns (id, name, label, description, created_at, created_by_id)
            values
            (100, 'user_roles', 'User Roles', 'Account access roles.', current_timestamp(6), null),
            (200, 'attempt_statuses', 'Attempt Statuses', 'Student test attempt states.', current_timestamp(6), null),
            (300, 'lesson_types', 'Lesson Types', 'Course lesson block types.', current_timestamp(6), null),
            (400, 'question_types', 'Question Types', 'Test question types.', current_timestamp(6), null),
            (500, 'student_identity_modes', 'Student Identity Modes', 'Test access identity modes.', current_timestamp(6), null)
            """);

        jdbcTemplate.update("""
            insert ignore into dropdown_options (id, label, value, position, active, dropdown_id)
            values
            (1001, 'Student', 'STUDENT', 1, true, 100),
            (1002, 'Teacher', 'TEACHER', 2, true, 100),
            (2001, 'In Progress', 'IN_PROGRESS', 1, true, 200),
            (2002, 'Submitted', 'SUBMITTED', 2, true, 200),
            (2003, 'Graded', 'GRADED', 3, true, 200),
            (3001, 'Rich Text', 'RICH_TEXT', 1, true, 300),
            (3002, 'Code', 'CODE', 2, true, 300),
            (4001, 'Single Choice', 'SINGLE_CHOICE', 1, true, 400),
            (4002, 'Multiple Choice', 'MULTIPLE_CHOICE', 2, true, 400),
            (4003, 'Open Ended', 'OPEN_ENDED', 3, true, 400),
            (4004, 'Programming', 'CODING', 4, true, 400),
            (5001, 'Require Login', 'REQUIRE_LOGIN', 1, true, 500),
            (5002, 'Name Input', 'NAME_INPUT', 2, true, 500),
            (5003, 'Nothing', 'ANONYMOUS', 3, true, 500)
            """);
    }

    private void backfillDropdownBackedColumns() {
        jdbcTemplate.execute("""
            update users
            set role_option_id = case upper(coalesce(role, 'STUDENT'))
              when 'TEACHER' then 1002
              else 1001
            end
            where role_option_id is null
            """);

        jdbcTemplate.execute("""
            update lessons
            set type_option_id = case upper(coalesce(type, 'RICH_TEXT'))
              when 'CODE' then 3002
              else 3001
            end
            where type_option_id is null
            """);

        jdbcTemplate.execute("""
            update questions
            set type_option_id = case upper(coalesce(type, 'OPEN_ENDED'))
              when 'SINGLE_CHOICE' then 4001
              when 'MULTIPLE_CHOICE' then 4002
              when 'CODING' then 4004
              else 4003
            end
            where type_option_id is null
            """);

        jdbcTemplate.execute("""
            update tests
            set student_identity_option_id = case upper(coalesce(student_identity_mode, 'NAME_INPUT'))
              when 'REQUIRE_LOGIN' then 5001
              when 'ANONYMOUS' then 5003
              else 5002
            end
            where student_identity_option_id is null
            """);

        backfillAttemptStatusOptions();
    }

    private void backfillAttemptStatusOptions() {
        if (!columnExists("test_attempts", "status_option_id")) {
            return;
        }
        if (columnExists("test_attempts", "status")) {
            jdbcTemplate.execute("""
                update test_attempts
                set status_option_id = case upper(coalesce(status, 'IN_PROGRESS'))
                  when 'SUBMITTED' then 2002
                  when 'GRADED' then 2003
                  else 2001
                end
                where status_option_id is null
                """);
            return;
        }
        jdbcTemplate.execute("update test_attempts set status_option_id = 2001 where status_option_id is null");
    }

    private void backfillRenamedTestColumns() {
        if (columnExists("questions", "quiz_id") && columnExists("questions", "test_id")) {
            jdbcTemplate.execute("update questions set test_id = quiz_id where test_id is null and quiz_id is not null");
        }
        if (columnExists("test_share_links", "quiz_id") && columnExists("test_share_links", "test_id")) {
            jdbcTemplate.execute("update test_share_links set test_id = quiz_id where test_id is null and quiz_id is not null");
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
            select count(*) from information_schema.tables
            where table_schema = database()
            and table_name = ?
            """, Integer.class, tableName);

        return count != null && count > 0;
    }

    private boolean tableHasRows(String tableName) {
        Integer count = jdbcTemplate.queryForObject("select count(*) from " + tableName, Integer.class);
        return count != null && count > 0;
    }

    private void addColumnIfMissing(String tableName, String columnName, String definition) {
        if (!tableExists(tableName)) {
            return;
        }
        if (columnExists(tableName, columnName)) {
            return;
        }

        jdbcTemplate.execute("alter table " + tableName + " add column " + columnName + " " + definition);
    }

    private void dropColumnIfExists(String tableName, String columnName) {
        if (!tableExists(tableName) || !columnExists(tableName, columnName)) {
            return;
        }
        jdbcTemplate.execute("alter table " + tableName + " drop column " + columnName);
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
            select count(*) from information_schema.columns
            where table_schema = database()
            and table_name = ?
            and column_name = ?
            """, Integer.class, tableName, columnName);

        return count != null && count > 0;
    }
}
