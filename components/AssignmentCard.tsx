import Link from 'next/link';
import type { Assignment, StatusKey } from '@/lib/types';
import { colorOf, fmt, num, plainStatus, span } from '@/lib/format';

export function Sticker({ k, label }: { k: StatusKey | 'none'; label: string }) {
  return <span className={`sticker ${k}`}>{label}</span>;
}

export function whenLine(a: Assignment): string {
  const diff = new Date(a.deadline).getTime() - Date.now();
  return diff > 0 ? `sisa ${span(diff)}` : `lewat ${span(diff)}`;
}

/** Satu tugas ditampilkan sebagai kaset game. */
export default function AssignmentCard({
  a,
  status,
  score,
  xp,
  extra,
  plain = true,
}: {
  a: Assignment;
  status: { k: StatusKey | 'none'; label: string };
  score?: number | null;
  xp?: number | null;
  extra?: React.ReactNode;
  plain?: boolean;
}) {
  return (
    <Link href={`/tugas/${a.id}`} className={`acard c-${colorOf(a.id)}`}>
      <div className="acard-label">
        <span className="acard-course">{a.course || 'Tugas'}</span>
        <h3>{a.title}</h3>
      </div>
      <div className="acard-body">
        <p className="acard-meta">
          <b>Tenggat</b> {fmt(a.deadline)}
          <br />
          {whenLine(a)}
          {plain && status.k !== 'none' && (
            <>
              <br />
              <span className="muted">{plainStatus(status.k)}</span>
            </>
          )}
        </p>
        {extra}
        <div className="acard-foot">
          <Sticker k={status.k} label={status.label} />
          {score != null ? (
            <span className="score-chip">
              {num(score)} <span>/ {num(a.max_score)}</span>
            </span>
          ) : xp != null && xp > 0 ? (
            <span className="acard-xp">+{xp} XP</span>
          ) : null}
        </div>
      </div>
      <div className="acard-pins" aria-hidden="true" />
    </Link>
  );
}
