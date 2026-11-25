-- Kotak Tugas: mini game (Boss Battle, Tantangan Mingguan, Avatar Pixel).
-- Jalankan sekali di Supabase: SQL Editor > New query > tempel > Run.
-- Jalankan SETELAH schema.sql dan arcade.sql. Aman dijalankan ulang.
-- Tidak menghapus atau mengubah data yang sudah ada.

-- ---------------------------------------------------------------
-- 1. Avatar pixel: disimpan sebagai teks JSON pendek di profil sendiri
-- ---------------------------------------------------------------
alter table public.profiles add column if not exists avatar text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_avatar_len') then
    alter table public.profiles
      add constraint profiles_avatar_len check (avatar is null or length(avatar) <= 400);
  end if;
end $$;

-- ---------------------------------------------------------------
-- 2. Boss Battle: tiap tugas adalah satu boss.
--    Yang dikembalikan hanya jumlah, tanpa nama atau data pribadi.
-- ---------------------------------------------------------------
create or replace function public.boss_status()
returns table (assignment_id uuid, total bigint, ontime bigint, sent bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    (select count(*) from public.profiles p where p.role = 'mahasiswa'),
    count(s.id) filter (where s.submitted_at <= a.deadline),
    count(s.id)
  from public.assignments a
  left join public.submissions s on s.assignment_id = a.id
  group by a.id
$$;

revoke all on function public.boss_status() from public;
grant execute on function public.boss_status() to authenticated;

-- ---------------------------------------------------------------
-- 3. Tantangan Mingguan
-- ---------------------------------------------------------------
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.challenge_entries (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  image_path   text not null,
  caption      text check (caption is null or length(caption) <= 200),
  created_at   timestamptz not null default now(),
  unique (challenge_id, student_id)
);

create table if not exists public.challenge_votes (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  entry_id     uuid not null references public.challenge_entries (id) on delete cascade,
  voter_id     uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (challenge_id, voter_id)
);

create index if not exists challenge_entries_challenge_idx on public.challenge_entries (challenge_id);
create index if not exists challenge_votes_entry_idx on public.challenge_votes (entry_id);

-- Apakah tantangan masih dibuka (jam server).
create or replace function public.challenge_open(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.challenges c
    where c.id = cid and now() >= c.starts_at and now() < c.ends_at
  );
$$;

-- Penjaga suara: satu suara per tantangan, tidak boleh memilih karya sendiri,
-- hanya saat tantangan dibuka, dan dosen tidak ikut memilih.
create or replace function public.challenge_votes_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.challenge_entries%rowtype;
begin
  if auth.uid() is null then
    return new;
  end if;
  if public.is_dosen() then
    raise exception 'Akun dosen tidak ikut memilih.';
  end if;
  select * into e from public.challenge_entries where id = new.entry_id;
  if not found or e.challenge_id <> new.challenge_id then
    raise exception 'Karya tidak ditemukan di tantangan ini.';
  end if;
  if e.student_id = new.voter_id then
    raise exception 'Kamu tidak bisa memilih karyamu sendiri.';
  end if;
  if not public.challenge_open(new.challenge_id) then
    raise exception 'Voting sudah ditutup.';
  end if;
  return new;
end;
$$;

drop trigger if exists challenge_votes_guard on public.challenge_votes;
create trigger challenge_votes_guard
  before insert or update on public.challenge_votes
  for each row execute function public.challenge_votes_guard();

alter table public.challenges        enable row level security;
alter table public.challenge_entries enable row level security;
alter table public.challenge_votes   enable row level security;

drop policy if exists "tantangan: semua pengguna masuk bisa melihat" on public.challenges;
create policy "tantangan: semua pengguna masuk bisa melihat"
  on public.challenges for select to authenticated using (true);

drop policy if exists "tantangan: dosen membuat" on public.challenges;
create policy "tantangan: dosen membuat"
  on public.challenges for insert to authenticated with check (public.is_dosen());

drop policy if exists "tantangan: dosen mengubah" on public.challenges;
create policy "tantangan: dosen mengubah"
  on public.challenges for update to authenticated
  using (public.is_dosen()) with check (public.is_dosen());

drop policy if exists "tantangan: dosen menghapus" on public.challenges;
create policy "tantangan: dosen menghapus"
  on public.challenges for delete to authenticated using (public.is_dosen());

drop policy if exists "karya tantangan: semua pengguna masuk bisa melihat" on public.challenge_entries;
create policy "karya tantangan: semua pengguna masuk bisa melihat"
  on public.challenge_entries for select to authenticated using (true);

drop policy if exists "karya tantangan: mahasiswa mengirim atas namanya" on public.challenge_entries;
create policy "karya tantangan: mahasiswa mengirim atas namanya"
  on public.challenge_entries for insert to authenticated
  with check (
    student_id = auth.uid()
    and not public.is_dosen()
    and image_path like auth.uid()::text || '/%'
    and public.challenge_open(challenge_id)
  );

drop policy if exists "karya tantangan: mahasiswa ubah miliknya saat dibuka" on public.challenge_entries;
create policy "karya tantangan: mahasiswa ubah miliknya saat dibuka"
  on public.challenge_entries for update to authenticated
  using (student_id = auth.uid() and public.challenge_open(challenge_id))
  with check (
    student_id = auth.uid()
    and image_path like auth.uid()::text || '/%'
    and public.challenge_open(challenge_id)
  );

drop policy if exists "karya tantangan: hapus milik sendiri saat dibuka, dosen bebas" on public.challenge_entries;
create policy "karya tantangan: hapus milik sendiri saat dibuka, dosen bebas"
  on public.challenge_entries for delete to authenticated
  using ((student_id = auth.uid() and public.challenge_open(challenge_id)) or public.is_dosen());

-- Suara hanya terlihat oleh pemiliknya. Jumlah suara diambil lewat challenge_board().
drop policy if exists "suara: lihat milik sendiri" on public.challenge_votes;
create policy "suara: lihat milik sendiri"
  on public.challenge_votes for select to authenticated using (voter_id = auth.uid());

drop policy if exists "suara: memilih atas namanya" on public.challenge_votes;
create policy "suara: memilih atas namanya"
  on public.challenge_votes for insert to authenticated with check (voter_id = auth.uid());

drop policy if exists "suara: batalkan milik sendiri saat dibuka" on public.challenge_votes;
create policy "suara: batalkan milik sendiri saat dibuka"
  on public.challenge_votes for delete to authenticated
  using (voter_id = auth.uid() and public.challenge_open(challenge_id));

-- Galeri satu tantangan: nama depan, jumlah suara, dan apakah milikku / kupilih.
create or replace function public.challenge_board(cid uuid)
returns table (
  entry_id uuid, author text, image_path text, caption text,
  created_at timestamptz, votes bigint, is_mine boolean, my_vote boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    coalesce(nullif(split_part(trim(p.full_name), ' ', 1), ''), 'Player'),
    e.image_path,
    e.caption,
    e.created_at,
    (select count(*) from public.challenge_votes v where v.entry_id = e.id),
    (e.student_id = auth.uid()),
    exists (select 1 from public.challenge_votes v where v.entry_id = e.id and v.voter_id = auth.uid())
  from public.challenge_entries e
  join public.profiles p on p.id = e.student_id
  where e.challenge_id = cid
  order by 6 desc, e.created_at
$$;

revoke all on function public.challenge_board(uuid) from public;
grant execute on function public.challenge_board(uuid) to authenticated;

-- Hitungan pribadi untuk lencana: berapa karya dikirim dan berapa tantangan dimenangkan.
-- Menang = tantangan sudah ditutup dan suara karyaku tertinggi (minimal 1 suara, seri ikut menang).
create or replace function public.my_challenge_stats()
returns table (entries bigint, wins bigint)
language sql
stable
security definer
set search_path = public
as $$
  with v as (
    select e.id, e.challenge_id, e.student_id,
           (select count(*) from public.challenge_votes x where x.entry_id = e.id) as n
    from public.challenge_entries e
  ),
  mx as (
    select challenge_id, max(n) as top from v group by challenge_id
  )
  select
    (select count(*) from v where v.student_id = auth.uid()),
    (select count(*)
       from v
       join mx on mx.challenge_id = v.challenge_id
       join public.challenges c on c.id = v.challenge_id
      where v.student_id = auth.uid()
        and v.n > 0
        and v.n = mx.top
        and now() >= c.ends_at)
$$;

revoke all on function public.my_challenge_stats() from public;
grant execute on function public.my_challenge_stats() to authenticated;

-- ---------------------------------------------------------------
-- 4. Penyimpanan gambar tantangan (privat, maks 5 MB, hanya gambar)
--    Jalur: <student_id>/<challenge_id>-<nama-berkas>
--    Semua pengguna masuk boleh melihat, karena ini galeri kelas.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('challenge-art', 'challenge-art', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = false;

drop policy if exists "galeri: semua pengguna masuk bisa melihat" on storage.objects;
create policy "galeri: semua pengguna masuk bisa melihat"
  on storage.objects for select to authenticated
  using (bucket_id = 'challenge-art');

drop policy if exists "galeri: mahasiswa unggah ke folder sendiri" on storage.objects;
create policy "galeri: mahasiswa unggah ke folder sendiri"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'challenge-art'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.is_dosen()
  );

drop policy if exists "galeri: mahasiswa ganti berkas sendiri" on storage.objects;
create policy "galeri: mahasiswa ganti berkas sendiri"
  on storage.objects for update to authenticated
  using (bucket_id = 'challenge-art' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'challenge-art' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "galeri: hapus berkas sendiri, dosen bebas" on storage.objects;
create policy "galeri: hapus berkas sendiri, dosen bebas"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'challenge-art'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_dosen())
  );
