'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { defaultDeadlineInput, fromWibInput } from '@/lib/format';

export default function ChallengeForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [ends, setEnds] = useState(defaultDeadlineInput());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const iso = fromWibInput(ends);
    if (!title.trim()) return setError('Isi judul tantangan.');
    if (!iso || new Date(iso).getTime() <= Date.now()) return setError('Pilih batas waktu yang masih di masa depan.');
    setBusy(true);
    const { data, error: err } = await supabase()
      .from('challenges')
      .insert({ title: title.trim(), description: desc.trim() || null, ends_at: iso, created_by: user?.id })
      .select('id')
      .single();
    setBusy(false);
    if (err || !data) {
      setError('Tantangan gagal disimpan. Pastikan akunmu dosen dan arcade2.sql sudah dijalankan.');
      return;
    }
    router.replace(`/tantangan/${(data as { id: string }).id}`);
  }

  return (
    <>
      <div className="crumb">
        <Link href="/tantangan" className="btn btn-sm">← Kembali</Link>
      </div>
      <h1 className="page-title">
        Tantangan <mark>baru.</mark>
      </h1>
      <form className="card card-pad" style={{ marginTop: 28, maxWidth: 760 }} onSubmit={submit}>
        {error && <div className="notice err" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="t">Tema tantangan</label>
          <input id="t" type="text" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Logo kedai kopi dalam 10 menit" />
        </div>
        <div className="field">
          <label htmlFor="d">Aturan main (opsional)</label>
          <textarea id="d" rows={5} maxLength={600} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Apa yang harus dibuat, ukuran gambar, hal yang dilarang" />
        </div>
        <div className="field">
          <label htmlFor="e">Ditutup pada (WIB)</label>
          <input id="e" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
          <small>Tantangan langsung dibuka. Pengiriman karya dan voting berakhir pada waktu ini.</small>
        </div>
        <button type="submit" className="btn btn-pink" disabled={busy}>
          {busy ? 'Menyimpan…' : 'Buka tantangan'}
        </button>
      </form>
    </>
  );
}
