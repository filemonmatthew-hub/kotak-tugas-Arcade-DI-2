import type { Assignment, Submission } from './types';

/*
 * Aturan main. Rumus XP di sini harus sama persis dengan fungsi leaderboard() di supabase/arcade.sql.
 *   Setor            +50
 *   Tepat waktu      +20  (disetor sebelum atau tepat di tenggat)
 *   Nilai            +0 sampai +100  (nilai dibagi nilai maksimal, dikali 100)
 * Satu tugas paling banyak memberi 170 XP. Nilai akhir kuliah tetap dari dosen. XP hanya hiburan.
 */
export const XP_SUBMIT = 50;
export const XP_ON_TIME = 20;
export const XP_SCORE_MAX = 100;
export const XP_PER_LEVEL = 200;

type Sub = Pick<Submission, 'submitted_at' | 'score'> | null | undefined;
type Asg = Pick<Assignment, 'deadline' | 'max_score'>;

export function isOnTime(a: Asg, s: Sub): boolean {
  return !!s && new Date(s.submitted_at).getTime() <= new Date(a.deadline).getTime();
}

/** Persen nilai 0..100 dibulatkan, atau null kalau belum dinilai. */
export function scorePct(a: Asg, s: Sub): number | null {
  if (!s || s.score == null) return null;
  // toFixed(6) membuang galat desimal (misalnya 94.49999999999999 menjadi 94.5),
  // supaya hasilnya sama dengan round() numerik di PostgreSQL.
  const raw = Number(((Number(s.score) * 100) / Number(a.max_score)).toFixed(6));
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export interface XpParts {
  submit: number;
  onTime: number;
  score: number;
  total: number;
  /** true kalau bagian nilai masih menunggu dosen */
  pending: boolean;
}

export function xpParts(a: Asg, s: Sub): XpParts {
  if (!s) return { submit: 0, onTime: 0, score: 0, total: 0, pending: false };
  const pct = scorePct(a, s);
  const parts = {
    submit: XP_SUBMIT,
    onTime: isOnTime(a, s) ? XP_ON_TIME : 0,
    score: pct ?? 0,
  };
  return { ...parts, total: parts.submit + parts.onTime + parts.score, pending: pct == null };
}

export function totalXp(rows: { a: Asg; s: Sub }[]): number {
  return rows.reduce((t, r) => t + xpParts(r.a, r.s).total, 0);
}

export interface LevelInfo {
  level: number;
  into: number;
  need: number;
  pct: number;
}

export function levelOf(xp: number): LevelInfo {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, into, need: XP_PER_LEVEL, pct: Math.round((into / XP_PER_LEVEL) * 100) };
}

export function titleOf(level: number): string {
  if (level >= 10) return 'LEGEND';
  if (level >= 7) return 'ELITE';
  if (level >= 5) return 'PRO';
  if (level >= 3) return 'PLAYER';
  return 'ROOKIE';
}

export type Letter = 'S' | 'A' | 'B' | 'C' | 'D';

export function letterOf(pct: number): Letter {
  if (pct >= 95) return 'S';
  if (pct >= 85) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 55) return 'C';
  return 'D';
}

/** Kombo: berapa tugas berturut-turut yang disetor tepat waktu, dihitung sampai tugas terbaru. */
export function comboOf(rows: { a: Assignment; s: Sub }[], now = Date.now()): number {
  const sorted = rows.slice().sort((x, y) => new Date(x.a.deadline).getTime() - new Date(y.a.deadline).getTime());
  let run = 0;
  for (const r of sorted) {
    if (r.s) {
      run = isOnTime(r.a, r.s) ? run + 1 : 0;
    } else if (new Date(r.a.deadline).getTime() < now) {
      run = 0;
    }
  }
  return run;
}

export interface Badge {
  id: string;
  name: string;
  hint: string;
  earned: boolean;
  icon: 'coin' | 'clock' | 'flame' | 'star' | 'crown' | 'skull' | 'brush' | 'trophy';
}

export interface Extras {
  /** boss kelas yang ikut dikalahkan */
  bossWins: number;
  /** karya tantangan yang pernah dikirim */
  entries: number;
  /** tantangan yang dimenangkan */
  wins: number;
}

export function badgesOf(rows: { a: Assignment; s: Sub }[], combo: number, extra: Extras = { bossWins: 0, entries: 0, wins: 0 }): Badge[] {
  const sent = rows.filter((r) => r.s);
  const onTime = sent.filter((r) => isOnTime(r.a, r.s));
  const hasS = rows.some((r) => {
    const p = scorePct(r.a, r.s);
    return p != null && letterOf(p) === 'S';
  });
  return [
    { id: 'first', name: 'PERTAMA', hint: 'Setor tugas pertamamu', earned: sent.length >= 1, icon: 'coin' },
    { id: 'ontime', name: 'TEPAT WAKTU', hint: 'Setor 3 tugas sebelum tenggat', earned: onTime.length >= 3, icon: 'clock' },
    { id: 'combo', name: 'KOMBO X3', hint: 'Setor 3 tugas tepat waktu berturut-turut', earned: combo >= 3, icon: 'flame' },
    { id: 'rank-s', name: 'SKOR S', hint: 'Dapat nilai 95% atau lebih', earned: hasS, icon: 'star' },
    {
      id: 'all',
      name: 'KOLEKTOR',
      hint: 'Setor semua tugas (minimal 3 tugas)',
      earned: rows.length >= 3 && sent.length === rows.length,
      icon: 'crown',
    },
    { id: 'boss', name: 'PEMBURU BOSS', hint: 'Ikut mengalahkan boss kelas dengan setor tepat waktu', earned: extra.bossWins >= 1, icon: 'skull' },
    { id: 'art', name: 'SENIMAN', hint: 'Kirim satu karya ke Tantangan Mingguan', earned: extra.entries >= 1, icon: 'brush' },
    { id: 'win', name: 'JUARA', hint: 'Menang satu Tantangan Mingguan', earned: extra.wins >= 1, icon: 'trophy' },
  ];
}
