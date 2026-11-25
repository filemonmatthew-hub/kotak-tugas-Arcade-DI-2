'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import type { LeaderRow } from '@/lib/types';

/** Papan skor kelas. Hanya inisial 3 huruf dan XP yang tampil. */
export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [off, setOff] = useState(false);
  const [show, setShow] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const sb = supabase();
    const r = await sb.rpc('leaderboard');
    if (r.error) {
      setOff(true);
      return;
    }
    setRows(((r.data as LeaderRow[]) ?? []).map((x) => ({ ...x, pos: Number(x.pos), xp: Number(x.xp) })));
    if (user) {
      const p = await sb.from('profiles').select('show_on_board').eq('id', user.id).maybeSingle();
      if (!p.error && p.data) setShow((p.data as { show_on_board: boolean }).show_on_board);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle() {
    if (!user || show === null) return;
    setBusy(true);
    setErr('');
    const next = !show;
    const { error } = await supabase().from('profiles').update({ show_on_board: next }).eq('id', user.id);
    setBusy(false);
    if (error) {
      setErr('Pilihan gagal disimpan. Coba lagi.');
      return;
    }
    setShow(next);
    load();
  }

  if (off) return null;

  return (
    <section className="card" aria-label="Papan skor kelas">
      <div className="win-title" style={{ ['--c' as string]: 'var(--yellow)' }}>
        Papan skor kelas
      </div>
      {rows === null ? (
        <p className="muted" style={{ padding: 18 }}>
          Memuat skor…
        </p>
      ) : rows.length === 0 ? (
        <p className="muted" style={{ padding: 18 }}>
          Belum ada skor. Setor tugas pertama untuk masuk papan.
        </p>
      ) : (
        <ol className="board">
          {rows.map((r) => (
            <li key={`${r.pos}-${r.initials}-${r.is_me}`} className={r.is_me ? 'me' : ''}>
              <span className="pos">{String(r.pos).padStart(2, '0')}</span>
              <span className="ini">{r.initials}</span>
              <span className="dots" aria-hidden="true" />
              <span className="xp">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
      <div className="board-foot">
        <span>Yang terlihat hanya inisial dan XP.</span>
        {show !== null && (
          <button type="button" className="btn btn-sm" onClick={toggle} disabled={busy} aria-pressed={show}>
            {show ? 'Sembunyikan aku' : 'Tampilkan aku'}
          </button>
        )}
      </div>
      {err && (
        <p className="notice err" style={{ margin: 14 }} role="alert">
          {err}
        </p>
      )}
    </section>
  );
}
