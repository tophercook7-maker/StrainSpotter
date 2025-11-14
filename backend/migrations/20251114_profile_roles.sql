begin;

alter table profiles
  add column if not exists role text not null default 'member',
  add column if not exists membership_status text not null default 'active',
  add column if not exists profile_tags text[] not null default '{}',
  add column if not exists joined_via text,
  add column if not exists last_seen_at timestamptz;

create index if not exists profiles_role_idx on profiles(role);
create index if not exists profiles_membership_status_idx on profiles(membership_status);
create index if not exists profiles_profile_tags_idx on profiles using gin (profile_tags);

update profiles
set role = 'admin'
where role = 'member'
  and email in (
    'topher.cook7@gmail.com',
    'strainspotter25@gmail.com',
    'admin@strainspotter.com',
    'andrewbeck209@gmail.com'
  );

commit;

