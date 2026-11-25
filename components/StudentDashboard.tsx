'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from './AuthProvider';
import AssignmentCard from './AssignmentCard';
import Hud, { BadgeRow } from './Hud';
import Leaderboard from './Leaderboard';
import { BossCard } from './BossBattle';
import { usePlayer } from './usePlayer';
import { colorOf } from '@/lib/format';
import { bossState } from '@/lib/boss';
import { xpParts, XP_ON_TIME, XP_SUBMIT } from '@/lib/arcade';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const p = usePlayer();
  const { rows, items, xp, combo, badges, boss } = p;

  const bosses = useMemo(() => {
    const list = rows
      .filter((r) => boss[r.a.id] && boss[r.a.id].total > 0)
      .map((r) => ({ r, st: bossState(r.a, boss[r.a.id]) }));
    const fighting = list.filter((x) => x.st.phase === 'fighting').slice(0, 3);
    const done = list
      .filter((x) => x.st.phase !== 'fighting')
      .sort((x, y) => new Date(y.r.a.deadline).getTime() - new Date(x.r.a.deadline).getTime())
      .slice(0, 2);
    return [...fighting, ...done];
  }, [rows, boss]);

  if (!p.ready) return <p className="muted">Memuat tugas…</p>;

  const first = (profile?.full_name ?? '').split(' ')[0] || 'Player';
  const pending = rows.filter((r) => r.st.k === 'open' || r.st.k === 'openlate');
  const rest = rows.filter((r) => !(r.st.k === 'open' || r.st.k === 'openlate')).reverse();

  return (
    <>
      {p.error && <div className="notice err">{p.error}</div>}
      <h1 className="page-title">
        Player 1: <mark>{first}</mark>
      </h1>
      <p className="lead">
        {pending.length
          ? `${pending.length} kaset tugas menunggu kamu. Setor untuk dapat XP.`
          : rows.length
            ? 'Semua tugas yang terbuka sudah disetor. Tunggu nilai dari dosen.'
            : 'Belum ada tugas dari dosen. Kembali lagi nanti.'}
      </p>

      <Hud name={profile?.full_name ?? first} xp={xp} combo={combo} color={items[0] ? colorOf(items[0].id) : 'pink'} avatar={p.avatar} avatarLink={p.avatarOk} />
      <BadgeRow badges={badges} />

      <div className="menu-tiles">
        <Link href="/tantangan" className="menu-tile c-pink">
          <b>Tantangan Mingguan</b>
          <span>Kirim karya, lalu pilih favorit kelas. Menang dapat lencana JUARA.</span>
        </Link>
        {p.avatarOk && (
          <Link href="/avatar" className="menu-tile c-cyan">
            <b>Avatar pixel</b>
            <span>Dandani karaktermu. Item baru terbuka saat naik level dan dapat lencana.</span>
          </Link>
        )}
      </div>

      {rows.length === 0 && (
        <div className="empty" style={{ marginTop: 40 }}>
          <div className="empty-art" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <h3>Rak kosong</h3>
          <p>Begitu dosen membuat tugas, kasetnya muncul di sini lengkap dengan tenggat dan hadiah XP.</p>
        </div>
      )}

      {bosses.length > 0 && (
        <>
          <div className="sec-head">
            <h2>Boss kelas</h2>
            <span className="count">KALAHKAN BERSAMA</span>
          </div>
          <div className="boss-list">
            {bosses.map(({ r }) => (
              <BossCard key={r.a.id} a={r.a} row={boss[r.a.id]} mine={r.s} />
            ))}
          </div>
        </>
      )}

      {pending.length > 0 && (
        <>
          <div className="sec-head">
            <h2>Pilih kaset</h2>
            <span className="count">{pending.length} TUGAS</span>
          </div>
          <div className="grid">
            {pending.map((r) => (
              <AssignmentCard key={r.a.id} a={r.a} status={r.st} />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <div className="sec-head">
            <h2>Riwayat main</h2>
            <span className="count">{rest.length} TUGAS</span>
          </div>
          <div className="grid">
            {rest.map((r) => (
              <AssignmentCard key={r.a.id} a={r.a} status={r.st} score={r.s?.score ?? null} xp={r.s ? xpParts(r.a, r.s).total : null} />
            ))}
          </div>
        </>
      )}

      <div className="sec-head">
        <h2>Papan skor dan aturan main</h2>
      </div>
      <div className="two">
        <Leaderboard />
        <section className="card" aria-label="Cara dapat XP">
          <div className="win-title" style={{ ['--c' as string]: 'var(--green)' }}>
            Cara dapat XP
          </div>
          <ul className="rules">
            <li>
              <span>Setor tugas</span>
              <b>+{XP_SUBMIT} XP</b>
            </li>
            <li>
              <span>Setor tepat waktu</span>
              <b>+{XP_ON_TIME} XP</b>
            </li>
            <li>
              <span>Nilai dari dosen (nilai dibagi nilai maksimal)</span>
              <b>+0 s/d 100 XP</b>
            </li>
            <li>
              <span>Setiap {200} XP naik 1 level</span>
              <b>LV UP</b>
            </li>
          </ul>
          <p className="board-foot" style={{ display: 'block' }}>
            XP hanya untuk seru-seruan. Nilai kuliahmu tetap ditentukan dosen.
          </p>
        </section>
      </div>
    </>
  );
}
