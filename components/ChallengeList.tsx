'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { fmt, span } from '@/lib/format';
import type { Challenge } from '@/lib/types';

export type Phase = 'open' | 'upcoming' | 'closed';

export function phaseOf(c: Pick<Challenge, 'starts_at' | 'ends_at'>, now = Date.now()): Phase {
  if (now < new Date(c.starts_at).getTime()) return 'upcoming';
  if (now >= new Date(c.ends_at).getTime()) return 'closed';
  return 'open';
}

export function phaseLine(c: Pick<Challenge, 'starts_at' | 'ends_at'>): string {
  const ph = phaseOf(c);
  if (ph === 'open') return `Dibuka · sisa ${span(new Date(c.ends_at).getTime() - Date.now())}`;
  if (ph === 'upcoming') return `Mulai ${fmt(c.starts_at)}`;
  return `Selesai ${fmt(c.ends_at)}`;
}

export default function ChallengeList({ role }: { role: 'dosen' | 'mahasiswa' }) {
  const [list, setList] = useState<Challenge[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase();
      const [c, e] = await Promise.all([
        sb.from('challenges').select('*').order('ends_at', { ascending: false }),
        sb.from('challenge_entries').select('challenge_id'),
      ]);
      if (!alive) return;
      if (c.error) {
        setMissing(true);
        setList([]);
        return;
      }
      const m: Record<string, number> = {};
      ((e.data ?? []) as { challenge_id: string }[]).forEach((r) => (m[r.challenge_id] = (m[r.challenge_id] ?? 0) + 1));
      setCounts(m);
      setList(c.data as Challenge[]);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (list === null) return <p className="muted mono">Memuat…</p>;

  const open = list.filter((c) => phaseOf(c) === 'open');
  const soon = list.filter((c) => phaseOf(c) === 'upcoming');
  const done = list.filter((c) => phaseOf(c) === 'closed');

  const card = (c: Challenge) => (
    <Link key={c.id} href={`/tantangan/${c.id}`} className={`chal ${phaseOf(c)}`}>
      <p className="chal-tag">{phaseOf(c) === 'open' ? 'DIBUKA' : phaseOf(c) === 'upcoming' ? 'SEGERA' : 'SELESAI'}</p>
      <h3>{c.title}</h3>
      {c.description && <p className="chal-desc">{c.description}</p>}
      <p className="chal-meta">
        {phaseLine(c)}
        <br />
        {counts[c.id] ?? 0} karya masuk
      </p>
    </Link>
  );

  return (
    <>
      <div className="crumb">
        <Link href="/dashboard" className="btn btn-sm">← Kembali</Link>
      </div>
      <h1 className="page-title">
        Tantangan <mark>mingguan.</mark>
      </h1>
      <p className="lead">
        Dosen memberi tema. Kamu mengirim satu karya, lalu semua mahasiswa memilih satu karya favorit (bukan karya sendiri). Yang suaranya terbanyak jadi juara.
      </p>
      {role === 'dosen' && (
        <div style={{ marginTop: 22 }}>
          <Link href="/tantangan/baru" className="btn btn-pink">
            + Tantangan baru
          </Link>
        </div>
      )}

      {missing && (
        <div className="notice" style={{ marginTop: 28 }}>
          Fitur tantangan belum aktif. Minta pengelola situs menjalankan <b>supabase/arcade2.sql</b> di Supabase.
        </div>
      )}

      {!missing && list.length === 0 && (
        <div className="empty" style={{ marginTop: 40 }}>
          <h3>Belum ada tantangan</h3>
          <p>{role === 'dosen' ? 'Buat tantangan pertama, misalnya “gambar logo kopi dalam 10 menit”.' : 'Tunggu dosen membuat tantangan pertama.'}</p>
        </div>
      )}

      {open.length > 0 && (
        <>
          <div className="sec-head"><h2>Sedang dibuka</h2><span className="count">{open.length}</span></div>
          <div className="chal-grid">{open.map(card)}</div>
        </>
      )}
      {soon.length > 0 && (
        <>
          <div className="sec-head"><h2>Segera</h2><span className="count">{soon.length}</span></div>
          <div className="chal-grid">{soon.map(card)}</div>
        </>
      )}
      {done.length > 0 && (
        <>
          <div className="sec-head"><h2>Selesai</h2><span className="count">{done.length}</span></div>
          <div className="chal-grid">{done.map(card)}</div>
        </>
      )}
    </>
  );
}
