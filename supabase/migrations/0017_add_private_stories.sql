-- Add private story support
alter table stories 
  add column is_private boolean not null default false;