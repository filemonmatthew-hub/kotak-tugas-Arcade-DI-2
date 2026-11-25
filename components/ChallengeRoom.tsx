'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { phaseLine, phaseOf } from './ChallengeList';
import { fmt, safeFileName, sizeLabel } from '@/lib/format';
import type { Challenge, ChallengeEntryRow } from '@/lib/types';

const BUCKET = 'challenge-art';
const MAX_BYTES = 5 * 1024 * 1024;
const IMG_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default function ChallengeRoom({ id, role }: { id: string; role: 'dosen' | 'mahasiswa' }) {
  const { user } = useAuth();
  const router = useRouter();
  const [ch, setCh] = useState<Challenge | null | undefined>(undefined);
  const [rows, setRows] = useState<ChallengeEntryRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  const load = useCallback(async () => {
    const sb = supabase();
    const c = await sb.from('challenges').select('*').eq('id', id).maybeSingle();
    if (c.error || !c.data) {
      setCh(null);
      return;
    }
    setCh(c.data as Challenge);
    const b = await sb.rpc('challenge_board', { cid: id });
    const list = ((b.data ?? []) as Record<string, unknown>[]).map(
      (r) =>
        ({
          entry_id: String(r.entry_id),
          author: String(r.author),
          image_path: String(r.image_path),
          caption: (r.caption as string | null) ?? null,
          created_at: String(r.created_at),
          votes: Number(r.votes) || 0,
          is_mine: !!r.is_mine,
          my_vote: !!r.my_vote,
        }) as ChallengeEntryRow,
    );
    setRows(list);
    if (list.length) {
      const s = await sb.storage.from(BUCKET).createSignedUrls(list.map((x) => x.image_path), 3600);
      const m: Record<string, string> = {};
      (s.data ?? []).forEach((x) => {
        if (x.path && x.signedUrl) m[x.path] = x.signedUrl;
      });
      setUrls(m);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (ch === undefined) return <p className="muted mono">Memuat…</p>;
  if (ch === null) {
    return (
      <>
        <div className="crumb"><Link href="/tantangan" className="btn btn-sm">← Kembali</Link></div>
        <div className="notice err" style={{ marginTop: 24 }}>Tantangan tidak ditemukan.</div>
      </>
    );
  }

  const phase = phaseOf(ch);
  const mine = rows.find((r) => r.is_mine) ?? null;
  const myVote = rows.find((r) => r.my_vote) ?? null;
  const top = rows.reduce((m, r) => Math.max(m, r.votes), 0);
  const isWinner = (r: ChallengeEntryRow) => phase === 'closed' && top > 0 && r.votes === top;
  const student = role === 'mahasiswa';

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!user || !file) return setMsg({ ok: false, text: 'Pilih gambar dulu.' });
    if (!IMG_TYPES.includes(file.type)) return setMsg({ ok: false, text: 'Format harus PNG, JPG, WEBP, atau GIF.' });
    if (file.size > MAX_BYTES) return setMsg({ ok: false, text: `Gambar terlalu besar (${sizeLabel(file.size)}). Maksimal 5 MB.` });
    setBusy(true);
    const sb = supabase();
    const path = `${user.id}/${id}-${Date.now()}-${safeFileName(file.name)}`;
    const up = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return setMsg({ ok: false, text: 'Gambar gagal diunggah. Mungkin tantangan sudah ditutup.' });
    }
    const body = { image_path: path, caption: caption.trim() || null };
    const res = mine
      ? await sb.from('challenge_entries').update(body).eq('id', mine.entry_id)
      : await sb.from('challenge_entries').insert({ ...body, challenge_id: id, student_id: user.id });
    if (res.error) {
      await sb.storage.from(BUCKET).remove([path]);
      setBusy(false);
      return setMsg({ ok: false, text: 'Karya gagal dikirim. Mungkin tantangan sudah ditutup.' });
    }
    if (mine) await sb.storage.from(BUCKET).remove([mine.image_path]);
    setFile(null);
    setCaption('');
    setBusy(false);
    setMsg({ ok: true, text: mine ? 'Karyamu diganti.' : 'Karya terkirim. Kamu dapat lencana SENIMAN.' });
    await load();
  }

  async function vote(r: ChallengeEntryRow) {
    if (!user) return;
    setMsg(null);
    const sb = supabase();
    let err = null;
    if (r.my_vote) {
      err = (await sb.from('challenge_votes').delete().eq('challenge_id', id).eq('voter_id', user.id)).error;
    } else {
      if (myVote) await sb.from('challenge_votes').delete().eq('challenge_id', id).eq('voter_id', user.id);
      err = (await sb.from('challenge_votes').insert({ challenge_id: id, entry_id: r.entry_id, voter_id: user.id })).error;
    }
    if (err) setMsg({ ok: false, text: 'Suara gagal disimpan. Mungkin voting sudah ditutup.' });
    await load();
  }

  async function removeEntry(r: ChallengeEntryRow) {
    if (!window.confirm(`Hapus karya ${r.author}?`)) return;
    const sb = supabase();
    const del = await sb.from('challenge_entries').delete().eq('id', r.entry_id);
    if (del.error) return setMsg({ ok: false, text: 'Karya gagal dihapus.' });
    await sb.storage.from(BUCKET).remove([r.image_path]);
    await load();
  }

  async function removeChallenge() {
    if (!window.confirm('Hapus tantangan ini beserta semua karya dan suaranya?')) return;
    const sb = supabase();
    const paths = rows.map((r) => r.image_path);
    const del = await sb.from('challenges').delete().eq('id', id);
    if (del.error) return setMsg({ ok: false, text: 'Tantangan gagal dihapus.' });
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    router.replace('/tantangan');
  }

  return (
    <>
      <div className="crumb">
        <Link href="/tantangan" className="btn btn-sm">← Semua tantangan</Link>
      </div>

      <header className={`poster-head chal-head ${phase}`}>
        <p className="chal-tag">{phase === 'open' ? 'DIBUKA' : phase === 'upcoming' ? 'SEGERA' : 'SELESAI'}</p>
        <h1>{ch.title}</h1>
        <p className="muted mono">{phaseLine(ch)} · ditutup {fmt(ch.ends_at)}</p>
        {ch.description && <p className="chal-rules">{ch.description}</p>}
        {role === 'dosen' && (
          <div className="row" style={{ marginTop: 14 }}>
            <button type="button" className="btn btn-danger btn-sm" onClick={removeChallenge}>Hapus tantangan</button>
          </div>
        )}
      </header>

      {msg && (
        <div className={`notice ${msg.ok ? 'ok' : 'err'}`} role="status" style={{ marginTop: 22 }}>
          {msg.text}
        </div>
      )}

      {student && phase === 'open' && (
        <form className="card card-pad chal-send" onSubmit={send}>
          <h2>{mine ? 'Ganti karyamu' : 'Kirim karyamu'}</h2>
          <p className="muted">Satu karya per orang. PNG, JPG, WEBP, atau GIF, maksimal 5 MB.{mine ? ' Mengirim lagi akan menggantikan karya lamamu.' : ''}</p>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="img">Gambar</label>
            <input id="img" type="file" accept=".png,.jpg,.jpeg,.webp,.gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="field">
            <label htmlFor="cap">Keterangan singkat (opsional)</label>
            <input id="cap" type="text" maxLength={200} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Ceritakan idemu" />
          </div>
          <button type="submit" className="btn btn-pink" disabled={busy || !file}>
            {busy ? 'Mengirim…' : mine ? 'Ganti karya' : 'Kirim karya'}
          </button>
        </form>
      )}

      <div className="sec-head">
        <h2>{phase === 'closed' ? 'Hasil' : 'Galeri'}</h2>
        <span className="count">{rows.length} KARYA</span>
      </div>

      {student && phase === 'open' && rows.length > 0 && (
        <p className="muted" style={{ marginTop: -8, marginBottom: 18 }}>
          Kamu punya satu suara. {myVote ? 'Klik lagi pada karya pilihanmu untuk membatalkan, atau pilih karya lain untuk pindah suara.' : 'Pilih karya favoritmu (bukan karyamu sendiri).'}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="empty">
          <h3>Belum ada karya</h3>
          <p>{phase === 'open' && student ? 'Jadilah yang pertama mengirim.' : 'Karya yang masuk akan tampil di sini.'}</p>
        </div>
      ) : (
        <div className="art-grid">
          {rows.map((r) => (
            <article key={r.entry_id} className={`art-card${isWinner(r) ? ' win' : ''}${r.my_vote ? ' voted' : ''}`}>
              <div className="art-img">
                {urls[r.image_path] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[r.image_path]} alt={`Karya ${r.author}`} loading="lazy" />
                ) : (
                  <span className="muted mono">Memuat gambar…</span>
                )}
                {isWinner(r) && <span className="art-crown">JUARA</span>}
              </div>
              <div className="art-body">
                <div className="art-row">
                  <b>{r.author}{r.is_mine ? ' (kamu)' : ''}</b>
                  <span className="art-votes" title="Jumlah suara">♥ {r.votes}</span>
                </div>
                {r.caption && <p className="art-cap">{r.caption}</p>}
                <div className="row">
                  {student && phase === 'open' && !r.is_mine && (
                    <button type="button" className={`btn btn-sm ${r.my_vote ? 'btn-pink' : ''}`} onClick={() => vote(r)}>
                      {r.my_vote ? '♥ Pilihanmu' : 'Pilih ini'}
                    </button>
                  )}
                  {role === 'dosen' && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeEntry(r)}>Hapus</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
