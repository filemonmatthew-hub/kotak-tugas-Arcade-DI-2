import Link from 'next/link';
import { bossState, BOSS_GOAL, type BossRow } from '@/lib/boss';
import { colorOf, fmt } from '@/lib/format';
import { whenLine } from './AssignmentCard';
import type { Assignment, Submission } from '@/lib/types';

/** X = badan, W = mata putih, D = gelap. Tiga bentuk monster, dipilih dari id tugas. */
const MONSTERS: string[][] = [
  ['....XXXX....', '..XXXXXXXX..', '.XXXXXXXXXX.', '.XXWWXXWWXX.', 'XXXWDXXWDXXX', 'XXXXXXXXXXXX', 'XXXDDDDDDXXX', 'XXXXXXXXXXXX', '.XXX.XX.XXX.'],
  ['X..........X', '.X..XXXX..X.', '..XXXXXXXX..', '.XXWWXXWWXX.', '.XXWDXXWDXX.', 'XXXXXXXXXXXX', '.XXDXDXDXXX.', '..XXXXXXXX..', '.X.X....X.X.'],
  ['X..........X', 'XX........XX', '.XXXXXXXXXX.', 'XXXXXXXXXXXX', 'XXWWXXXXWWXX', 'XXWDXXXXWDXX', 'XXXXXDDXXXXX', '.XXDDDDDDXX.', '..XXXXXXXX..'],
];

const HEX: Record<string, string> = {
  blue: '#4d8bff',
  pink: '#ff3ea5',
  sun: '#ffe14d',
  mint: '#4dff9a',
  orange: '#ff8a2a',
  lilac: '#b18cff',
};

function pick(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % MONSTERS.length;
}

export function Monster({ id, dead = false, size = 96 }: { id: string; dead?: boolean; size?: number }) {
  const rows = MONSTERS[pick(id)];
  const body = HEX[colorOf(id)] ?? '#ff3ea5';
  const rects: React.ReactNode[] = [];
  rows.forEach((r, y) => {
    [...r].forEach((c, x) => {
      if (c === '.') return;
      const fill = c === 'X' ? body : c === 'W' ? (dead ? '#0b0b1f' : '#ffffff') : '#0b0b1f';
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />);
    });
  });
  return (
    <svg
      width={size}
      height={(size * rows.length) / 12}
      viewBox={`0 0 12 ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`monster${dead ? ' dead' : ''}`}
    >
      {rects}
    </svg>
  );
}

function HpBar({ pct }: { pct: number }) {
  const on = Math.round((pct / 100) * 20);
  return (
    <div className="hpbar" role="img" aria-label={`Sisa HP boss ${pct} persen`}>
      {Array.from({ length: 20 }, (_, i) => (
        <i key={i} className={i < on ? 'on' : ''} />
      ))}
    </div>
  );
}

/** Satu boss = satu tugas. HP turun tiap ada setoran tepat waktu. */
export function BossCard({ a, row, mine }: { a: Assignment; row: BossRow; mine: Submission | null }) {
  const st = bossState(a, row);
  const onTimeMine = !!mine && new Date(mine.submitted_at).getTime() <= new Date(a.deadline).getTime();
  const left = st.need - st.hits;
  return (
    <Link href={`/tugas/${a.id}`} className={`boss ${st.phase} c-${colorOf(a.id)}`}>
      <div className="boss-art">
        <Monster id={a.id} dead={st.phase === 'defeated'} />
      </div>
      <div className="boss-main">
        <p className="boss-tag">
          {st.phase === 'defeated' ? 'BOSS KALAH' : st.phase === 'escaped' ? 'BOSS KABUR' : 'BOSS'}
          <span>{a.course || 'Tugas'}</span>
        </p>
        <h3>{a.title}</h3>
        <HpBar pct={st.phase === 'defeated' ? 0 : st.hpPct} />
        <p className="boss-line">
          {st.phase === 'defeated' ? (
            <>HP 0. {st.hits} setoran tepat waktu. Yang ikut memukul dapat lencana PEMBURU BOSS.</>
          ) : st.phase === 'escaped' ? (
            <>
              Tenggat lewat, boss masih punya {left} HP. Hanya {st.hits} dari {st.need} pukulan yang masuk.
            </>
          ) : (
            <>
              Sisa HP {left} dari {st.need}. Kalahkan dengan setor tepat waktu ({Math.round(BOSS_GOAL * 100)}% kelas). {whenLine(a)}.
            </>
          )}
        </p>
        <p className="boss-me">
          {onTimeMine ? 'Pukulanmu sudah masuk.' : mine ? 'Setoranmu telat, belum jadi pukulan.' : st.phase === 'fighting' ? `Setor sebelum ${fmt(a.deadline)} untuk memukul.` : 'Kamu belum memukul boss ini.'}
        </p>
      </div>
    </Link>
  );
}
