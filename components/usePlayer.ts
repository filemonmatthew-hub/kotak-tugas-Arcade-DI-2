'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { statusOf } from '@/lib/format';
import { badgesOf, comboOf, levelOf, totalXp } from '@/lib/arcade';
import { countBossWins, toBossRow, type BossRow } from '@/lib/boss';
import { parseAvatar, serializeAvatar, type AvatarCfg } from '@/lib/avatar';
import type { Assignment, Submission } from '@/lib/types';

/**
 * Semua data pemain mahasiswa dalam satu tempat: tugas, setoran, XP, level, lencana, boss, avatar.
 * Bagian yang butuh arcade.sql dan arcade2.sql (boss, tantangan, avatar) boleh gagal tanpa merusak halaman.
 */
export function usePlayer() {
  const { user } = useAuth();
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [subs, setSubs] = useState<Record<string, Submission>>({});
  const [boss, setBoss] = useState<Record<string, BossRow>>({});
  const [stats, setStats] = useState({ entries: 0, wins: 0 });
  const [avatar, setAvatarState] = useState<AvatarCfg | null>(null);
  const [avatarOk, setAvatarOk] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const sb = supabase();
      const [a, s, b, c, v] = await Promise.all([
        sb.from('assignments').select('*').order('deadline', { ascending: true }),
        sb.from('submissions').select('*').eq('student_id', user.id),
        sb.rpc('boss_status'),
        sb.rpc('my_challenge_stats'),
        sb.from('profiles').select('avatar').eq('id', user.id).maybeSingle(),
      ]);
      if (!alive) return;
      if (a.error || s.error) {
        setError('Data tugas tidak bisa dimuat. Muat ulang halaman.');
        setItems([]);
        return;
      }
      const map: Record<string, Submission> = {};
      (s.data as Submission[]).forEach((x) => (map[x.assignment_id] = x));
      setSubs(map);
      if (!b.error && Array.isArray(b.data)) {
        const bm: Record<string, BossRow> = {};
        (b.data as Record<string, unknown>[]).forEach((r) => {
          const row = toBossRow(r);
          bm[row.assignment_id] = row;
        });
        setBoss(bm);
      }
      if (!c.error && Array.isArray(c.data) && c.data[0]) {
        setStats({ entries: Number(c.data[0].entries) || 0, wins: Number(c.data[0].wins) || 0 });
      }
      if (!v.error) {
        setAvatarOk(true);
        setAvatarState(parseAvatar((v.data as { avatar?: string | null } | null)?.avatar));
      }
      setItems(a.data as Assignment[]);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const rows = useMemo(() => (items ?? []).map((a) => ({ a, s: subs[a.id] ?? null, st: statusOf(a, subs[a.id]) })), [items, subs]);
  const xp = useMemo(() => totalXp(rows), [rows]);
  const level = useMemo(() => levelOf(xp).level, [xp]);
  const combo = useMemo(() => comboOf(rows), [rows]);
  const bossWins = useMemo(() => countBossWins(rows, boss), [rows, boss]);
  const badges = useMemo(() => badgesOf(rows, combo, { bossWins, entries: stats.entries, wins: stats.wins }), [rows, combo, bossWins, stats]);
  const earned = useMemo(() => new Set(badges.filter((b) => b.earned).map((b) => b.id)), [badges]);

  const saveAvatar = useCallback(
    async (cfg: AvatarCfg): Promise<boolean> => {
      if (!user) return false;
      const { error: e } = await supabase().from('profiles').update({ avatar: serializeAvatar(cfg) }).eq('id', user.id);
      if (e) return false;
      setAvatarState(cfg);
      return true;
    },
    [user],
  );

  return { ready: items !== null, error, items: items ?? [], rows, xp, level, combo, badges, earned, boss, avatar, avatarOk, saveAvatar };
}
