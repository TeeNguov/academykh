-- Academy KH database changes through 2026-07-01.
-- This file is a manual/reference companion to DatabaseSchemaMigrator.java.
-- The app migrator applies these safely with existence checks on startup.
-- If running this file by hand, apply only the statements your database still needs.

-- Attempt status moved from plain text to dropdown option id.
alter table test_attempts add column status_option_id bigint not null default 2001;

update test_attempts
set status_option_id = case upper(coalesce(status, 'IN_PROGRESS'))
  when 'SUBMITTED' then 2002
  when 'GRADED' then 2003
  else 2001
end
where status_option_id is null;

alter table test_attempts drop column status;
alter table test_attempts modify status_option_id bigint not null default 2001;

-- Test/question/lesson/user dropdown-backed columns.
alter table questions modify prompt longtext not null;
alter table questions modify explanation longtext null;
alter table questions add column type varchar(32) not null default 'OPEN_ENDED';
alter table questions modify type varchar(32) not null default 'OPEN_ENDED';
alter table questions add column type_option_id bigint null;
alter table questions add column archived bit not null default 0;
alter table questions add column test_id bigint null;

alter table tests add column student_identity_mode varchar(32) null;
alter table tests add column student_identity_option_id bigint null;

alter table lessons add column type varchar(24) not null default 'RICH_TEXT';
alter table lessons add column type_option_id bigint null;
alter table lessons add column code_language varchar(80) null;
alter table lessons modify content longtext not null;

alter table users add column role varchar(24) not null default 'STUDENT';
alter table users modify role varchar(24) not null default 'STUDENT';
alter table users add column role_option_id bigint null;

-- Shared test links.
alter table test_share_links add column test_id bigint null;
alter table test_share_links add column allow_student_review bit not null default 0;
alter table test_share_links add column simple_mode bit not null default 0;
alter table test_share_links add column invited_emails longtext null;
alter table test_share_links add column invited_group_ids longtext null;

-- Dropdown lookup tables and system seed data.
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
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

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
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

insert ignore into dropdowns (id, name, label, description, created_at, created_by_id)
values
(100, 'user_roles', 'User Roles', 'Account access roles.', current_timestamp(6), null),
(200, 'attempt_statuses', 'Attempt Statuses', 'Student test attempt states.', current_timestamp(6), null),
(300, 'lesson_types', 'Lesson Types', 'Course lesson block types.', current_timestamp(6), null),
(400, 'question_types', 'Question Types', 'Test question types.', current_timestamp(6), null),
(500, 'student_identity_modes', 'Student Identity Modes', 'Test access identity modes.', current_timestamp(6), null);

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
(5003, 'Nothing', 'ANONYMOUS', 3, true, 500);

-- Backfill dropdown-backed columns.
update users
set role_option_id = case upper(coalesce(role, 'STUDENT'))
  when 'TEACHER' then 1002
  else 1001
end
where role_option_id is null;

update lessons
set type_option_id = case upper(coalesce(type, 'RICH_TEXT'))
  when 'CODE' then 3002
  else 3001
end
where type_option_id is null;

update questions
set type_option_id = case upper(coalesce(type, 'OPEN_ENDED'))
  when 'SINGLE_CHOICE' then 4001
  when 'MULTIPLE_CHOICE' then 4002
  when 'CODING' then 4004
  else 4003
end
where type_option_id is null;

update tests
set student_identity_option_id = case upper(coalesce(student_identity_mode, 'NAME_INPUT'))
  when 'REQUIRE_LOGIN' then 5001
  when 'ANONYMOUS' then 5003
  else 5002
end
where student_identity_option_id is null;

update test_attempts
set status_option_id = 2001
where status_option_id is null;

-- Rename/backfill old quiz foreign keys if legacy columns still exist.
update questions
set test_id = quiz_id
where test_id is null and quiz_id is not null;

update test_share_links
set test_id = quiz_id
where test_id is null and quiz_id is not null;

-- Student groups for teacher-managed invitations.
create table student_groups (
  id bigint not null auto_increment,
  name varchar(180) not null,
  created_at datetime(6) not null,
  created_by_id bigint null,
  primary key (id),
  key idx_student_groups_created_by (created_by_id),
  constraint fk_student_groups_created_by foreign key (created_by_id) references users (id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

create table student_group_members (
  id bigint not null auto_increment,
  email varchar(160) not null,
  group_id bigint null,
  primary key (id),
  key idx_student_group_members_group (group_id),
  key idx_student_group_members_email (email),
  constraint fk_student_group_members_group foreign key (group_id) references student_groups (id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;

-- Course share links.
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
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
