import type { Assignment, Submission } from './types';

/*
 * Boss Battle: tiap tugas adalah satu boss.
 * Boss kalah kalau minimal 80% mahasiswa menyetor tepat waktu. Satu setoran tepat waktu = satu pukulan.
 * Angka total dan tepat waktu datang dari fungsi boss_status() di database (hanya jumlah, tanpa nama).
 */
export const BOSS_GOAL = 0.8;

export interface BossRow {
  assignment_id: string;
  total: number;
  ontime: number;
  sent: number;
}

export type BossPhase = 'fighting' | 'defeated' | 'escaped';

export interface BossState {
  /** pukulan yang dibutuhkan */
  need: number;
  /** pukulan yang sudah masuk, paling banyak sebesar need */
  hits: number;
  /** sisa HP dalam persen */
  hpPct: number;
  phase: BossPhase;
}

/** Baris dari rpc bisa berisi angka sebagai teks. Rapikan jadi angka. */
export function toBossRow(r: Record<string, unknown>): BossRow {
  return {
    assignment_id: String(r.assignment_id),
    total: Number(r.total) || 0,
    ontime: Number(r.ontime) || 0,
    sent: Number(r.sent) || 0,
  };
}

export function bossState(a: Pick<Assignment, 'deadline'>, b: BossRow, now = Date.now()): BossState {
  const need = Math.max(1, Math.ceil(b.total * BOSS_GOAL));
  const hits = Math.min(need, b.ontime);
  const hpPct = Math.round(((need - hits) / need) * 100);
  let phase: BossPhase = 'fighting';
  if (hits >= need) phase = 'defeated';
  else if (new Date(a.deadline).getTime() < now) phase = 'escaped';
  return { need, hits, hpPct, phase };
}

/** Apakah mahasiswa ini ikut memukul boss yang kalah. */
export function countBossWins(
  rows: { a: Pick<Assignment, 'id' | 'deadline'>; s: Pick<Submission, 'submitted_at'> | null }[],
  boss: Record<string, BossRow>,
): number {
  return rows.filter((r) => {
    const b = boss[r.a.id];
    if (!b || !r.s) return false;
    const onTime = new Date(r.s.submitted_at).getTime() <= new Date(r.a.deadline).getTime();
    return onTime && bossState(r.a, b).phase === 'defeated';
  }).length;
}
