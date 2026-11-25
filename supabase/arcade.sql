-- Kotak Tugas: lapisan arcade (papan skor kelas).
-- Jalankan sekali di Supabase: SQL Editor > New query > tempel > Run.
-- Aman dijalankan ulang. Tidak menghapus atau mengubah data yang sudah ada.

-- 1. Pilihan mahasiswa: tampil di papan skor atau tidak.
alter table public.profiles
  add column if not exists show_on_board boolean not null default true;

-- 2. Papan skor kelas.
-- Mengembalikan paling banyak 10 teratas, ditambah baris milik pemanggil kalau di luar 10 besar.
-- Yang terlihat hanya inisial 3 huruf, XP, dan peringkat. Nama lengkap, NIM, dan nilai tidak ikut.
-- Rumus XP harus sama dengan lib/arcade.ts:
--   50 (setor) + 20 (tepat waktu) + 0..100 (nilai dibagi nilai maksimal, dikali 100)
create or replace function public.leaderboard()
returns table (pos bigint, initials text, xp bigint, is_me boolean)
language sql
stable
security definer
set search_path = public
as $$
  with per as (
    select
      s.student_id,
      (
        50
        + case when s.submitted_at <= a.deadline then 20 else 0 end
        + case
            when s.score is not null
              then least(100, greatest(0, round(s.score * 100 / a.max_score)))::int
            else 0
          end
      ) as pts
    from public.submissions s
    join public.assignments a on a.id = s.assignment_id
  ),
  tot as (
    select p.id, p.full_name, coalesce(sum(per.pts), 0)::bigint as total
    from public.profiles p
    left join per on per.student_id = p.id
    where p.role = 'mahasiswa'
      and (p.show_on_board or p.id = auth.uid())
    group by p.id, p.full_name
  ),
  ranked as (
    select
      t.id,
      t.full_name,
      t.total,
      rank() over (order by t.total desc) as rnk,
      regexp_split_to_array(
        nullif(trim(regexp_replace(t.full_name, '[^[:alpha:] ]', '', 'g')), ''),
        '\s+'
      ) as w
    from tot t
    where t.total > 0 or t.id = auth.uid()
  )
  select
    r.rnk,
    upper(
      case
        when r.w is null then '???'
        when array_length(r.w, 1) >= 3 then left(r.w[1], 1) || left(r.w[2], 1) || left(r.w[3], 1)
        when array_length(r.w, 1) = 2 then left(r.w[1], 2) || left(r.w[2], 1)
        else left(r.w[1], 3)
      end
    ),
    r.total,
    (r.id = auth.uid())
  from ranked r
  where r.rnk <= 10 or r.id = auth.uid()
  order by r.rnk, r.full_name
$$;

revoke all on function public.leaderboard() from public;
grant execute on function public.leaderboard() to authenticated;
