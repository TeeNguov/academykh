create table password_reset_tokens (
  id bigint not null auto_increment,
  user_id bigint null,
  token_hash varchar(64) not null,
  reset_url varchar(600) null,
  expires_at datetime(6) not null,
  used_at datetime(6) null,
  created_at datetime(6) not null,
  primary key (id),
  unique key uk_password_reset_tokens_hash (token_hash),
  key idx_password_reset_tokens_user (user_id),
  key idx_password_reset_tokens_expires_at (expires_at),
  constraint fk_password_reset_tokens_user foreign key (user_id) references users (id)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_unicode_ci;
