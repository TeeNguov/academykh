CREATE DATABASE IF NOT EXISTS academy_kh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE academy_kh;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quizzes;

DROP TABLE IF EXISTS attempt_answers;
DROP TABLE IF EXISTS test_attempts;
DROP TABLE IF EXISTS test_share_links;
DROP TABLE IF EXISTS student_group_members;
DROP TABLE IF EXISTS student_groups;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS code_submissions;
DROP TABLE IF EXISTS coding_challenges;
DROP TABLE IF EXISTS course_enrollments;
DROP TABLE IF EXISTS course_share_links;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS course_modules;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS dropdown_options;
DROP TABLE IF EXISTS dropdowns;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS users;

DROP TABLE IF EXISTS attempt_answer;
DROP TABLE IF EXISTS test_share_link;
DROP TABLE IF EXISTS question_option;
DROP TABLE IF EXISTS question;
DROP TABLE IF EXISTS code_submission;
DROP TABLE IF EXISTS coding_challenge;
DROP TABLE IF EXISTS course_enrollment;
DROP TABLE IF EXISTS lesson;
DROP TABLE IF EXISTS course_module;
DROP TABLE IF EXISTS course;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'STUDENT',
  role_option_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_role_option (role_option_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NULL,
  token_hash VARCHAR(64) NOT NULL,
  reset_url VARCHAR(600) NULL,
  expires_at DATETIME(6) NOT NULL,
  used_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_password_reset_tokens_hash (token_hash),
  KEY idx_password_reset_tokens_user (user_id),
  KEY idx_password_reset_tokens_expires_at (expires_at),
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dropdowns (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  label VARCHAR(180) NOT NULL,
  description LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL,
  created_by_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dropdowns_name (name),
  KEY idx_dropdowns_created_by (created_by_id),
  CONSTRAINT fk_dropdowns_created_by FOREIGN KEY (created_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dropdown_options (
  id BIGINT NOT NULL AUTO_INCREMENT,
  label VARCHAR(180) NOT NULL,
  value VARCHAR(180) NOT NULL,
  position INT NOT NULL,
  active BIT NOT NULL,
  dropdown_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_dropdown_options_dropdown (dropdown_id),
  CONSTRAINT fk_dropdown_options_dropdown FOREIGN KEY (dropdown_id) REFERENCES dropdowns (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO dropdowns (id, name, label, description, created_at, created_by_id) VALUES
(100, 'user_roles', 'User Roles', 'Account access roles.', CURRENT_TIMESTAMP(6), NULL),
(200, 'attempt_statuses', 'Attempt Statuses', 'Student test attempt states.', CURRENT_TIMESTAMP(6), NULL),
(300, 'lesson_types', 'Lesson Types', 'Course lesson block types.', CURRENT_TIMESTAMP(6), NULL),
(400, 'question_types', 'Question Types', 'Test question types.', CURRENT_TIMESTAMP(6), NULL),
(500, 'student_identity_modes', 'Student Identity Modes', 'Test access identity modes.', CURRENT_TIMESTAMP(6), NULL);

INSERT INTO dropdown_options (id, label, value, position, active, dropdown_id) VALUES
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
(5003, 'Nothing', 'ANONYMOUS', 3, true, 500);

CREATE TABLE courses (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  language VARCHAR(80) NOT NULL,
  level VARCHAR(80) NOT NULL,
  published BIT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  created_by_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_courses_created_by (created_by_id),
  CONSTRAINT fk_courses_created_by FOREIGN KEY (created_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_modules (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  position INT NOT NULL,
  course_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_course_modules_course (course_id),
  CONSTRAINT fk_course_modules_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lessons (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  content LONGTEXT NOT NULL,
  position INT NOT NULL,
  published BIT NOT NULL,
  type VARCHAR(24) NOT NULL DEFAULT 'RICH_TEXT',
  type_option_id BIGINT NULL,
  code_language VARCHAR(80) NULL,
  module_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_lessons_module (module_id),
  KEY idx_lessons_type_option (type_option_id),
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES course_modules (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_enrollments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  enrolled_at DATETIME(6) NOT NULL,
  student_id BIGINT NULL,
  course_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_course_enrollments_student (student_id),
  KEY idx_course_enrollments_course (course_id),
  CONSTRAINT fk_course_enrollments_student FOREIGN KEY (student_id) REFERENCES users (id),
  CONSTRAINT fk_course_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_share_links (
  id BIGINT NOT NULL AUTO_INCREMENT,
  token VARCHAR(80) NOT NULL,
  label VARCHAR(180) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  active BIT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  course_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_course_share_links_token (token),
  KEY idx_course_share_links_course (course_id),
  CONSTRAINT fk_course_share_links_course FOREIGN KEY (course_id) REFERENCES courses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE coding_challenges (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  language VARCHAR(80) NOT NULL,
  difficulty VARCHAR(80) NOT NULL,
  prompt LONGTEXT NOT NULL,
  starter_code LONGTEXT NULL,
  published BIT NOT NULL,
  course_id BIGINT NULL,
  created_by_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_coding_challenges_course (course_id),
  KEY idx_coding_challenges_created_by (created_by_id),
  CONSTRAINT fk_coding_challenges_course FOREIGN KEY (course_id) REFERENCES courses (id),
  CONSTRAINT fk_coding_challenges_created_by FOREIGN KEY (created_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE code_submissions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  language VARCHAR(80) NOT NULL,
  source_code LONGTEXT NOT NULL,
  status VARCHAR(255) NOT NULL,
  submitted_at DATETIME(6) NOT NULL,
  student_id BIGINT NULL,
  challenge_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_code_submissions_student (student_id),
  KEY idx_code_submissions_challenge (challenge_id),
  CONSTRAINT fk_code_submissions_student FOREIGN KEY (student_id) REFERENCES users (id),
  CONSTRAINT fk_code_submissions_challenge FOREIGN KEY (challenge_id) REFERENCES coding_challenges (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  exam BIT NOT NULL,
  duration_minutes INT NULL,
  student_identity_mode VARCHAR(32) NULL,
  student_identity_option_id BIGINT NULL,
  published BIT NOT NULL,
  course_id BIGINT NULL,
  created_by_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_tests_course (course_id),
  KEY idx_tests_created_by (created_by_id),
  KEY idx_tests_student_identity_option (student_identity_option_id),
  CONSTRAINT fk_tests_course FOREIGN KEY (course_id) REFERENCES courses (id),
  CONSTRAINT fk_tests_created_by FOREIGN KEY (created_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  type VARCHAR(32) NOT NULL DEFAULT 'OPEN_ENDED',
  type_option_id BIGINT NULL,
  prompt LONGTEXT NOT NULL,
  explanation LONGTEXT NULL,
  position INT NOT NULL,
  points INT NOT NULL,
  archived BIT NOT NULL,
  test_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_questions_test (test_id),
  KEY idx_questions_type_option (type_option_id),
  CONSTRAINT fk_questions_test FOREIGN KEY (test_id) REFERENCES tests (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE question_options (
  id BIGINT NOT NULL AUTO_INCREMENT,
  label LONGTEXT NOT NULL,
  correct BIT NOT NULL,
  position INT NOT NULL,
  archived BIT NOT NULL DEFAULT 0,
  question_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_question_options_question (question_id),
  CONSTRAINT fk_question_options_question FOREIGN KEY (question_id) REFERENCES questions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE test_share_links (
  id BIGINT NOT NULL AUTO_INCREMENT,
  token VARCHAR(80) NOT NULL,
  label VARCHAR(180) NOT NULL,
  available_from DATETIME(6) NULL,
  expires_at DATETIME(6) NOT NULL,
  active BIT NOT NULL,
  max_attempts INT NOT NULL,
  allow_student_review BIT NOT NULL DEFAULT 0,
  invited_emails LONGTEXT NULL,
  invited_group_ids LONGTEXT NULL,
  created_at DATETIME(6) NOT NULL,
  test_id BIGINT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_test_share_links_token (token),
  KEY idx_test_share_links_test (test_id),
  CONSTRAINT fk_test_share_links_test FOREIGN KEY (test_id) REFERENCES tests (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_groups (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  created_by_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_student_groups_created_by (created_by_id),
  CONSTRAINT fk_student_groups_created_by FOREIGN KEY (created_by_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_group_members (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(160) NOT NULL,
  group_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_student_group_members_group (group_id),
  KEY idx_student_group_members_email (email),
  CONSTRAINT fk_student_group_members_group FOREIGN KEY (group_id) REFERENCES student_groups (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE test_attempts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  student_name VARCHAR(160) NOT NULL,
  status_option_id BIGINT NOT NULL DEFAULT 2001,
  score_percent INT NULL,
  started_at DATETIME(6) NOT NULL,
  submitted_at DATETIME(6) NULL,
  student_id BIGINT NULL,
  test_id BIGINT NULL,
  share_link_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_test_attempts_student (student_id),
  KEY idx_test_attempts_test (test_id),
  KEY idx_test_attempts_share_link (share_link_id),
  KEY idx_test_attempts_status_option (status_option_id),
  CONSTRAINT fk_test_attempts_student FOREIGN KEY (student_id) REFERENCES users (id),
  CONSTRAINT fk_test_attempts_test FOREIGN KEY (test_id) REFERENCES tests (id),
  CONSTRAINT fk_test_attempts_share_link FOREIGN KEY (share_link_id) REFERENCES test_share_links (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attempt_answers (
  id BIGINT NOT NULL AUTO_INCREMENT,
  answer_text LONGTEXT NULL,
  selected_option_ids LONGTEXT NULL,
  awarded_points INT NULL,
  feedback LONGTEXT NULL,
  requires_manual_grading BIT NOT NULL,
  attempt_id BIGINT NULL,
  question_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_attempt_answers_attempt (attempt_id),
  KEY idx_attempt_answers_question (question_id),
  CONSTRAINT fk_attempt_answers_attempt FOREIGN KEY (attempt_id) REFERENCES test_attempts (id),
  CONSTRAINT fk_attempt_answers_question FOREIGN KEY (question_id) REFERENCES questions (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
