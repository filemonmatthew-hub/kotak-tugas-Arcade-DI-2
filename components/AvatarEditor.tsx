'use client';

import { useState } from 'react';
import Link from 'next/link';
import AvatarArt from './AvatarArt';
import { usePlayer } from './usePlayer';
import { useAuth } from './AuthProvider';
import { levelOf, titleOf } from '@/lib/arcade';
import {
  ACCESSORIES, BACKGROUNDS, DEFAULT_AVATAR, HAIR_COLORS, HAIR_STYLES, OUTFITS, OUTFIT_COLORS, SKIN,
  isUnlocked, needText, type AvatarCfg, type Opt,
} from '@/lib/avatar';

function Group({
  title, items, value, onPick, level, earned, swatch,
}: {
  title: string;
  items: (Opt & { c?: string })[];
  value: number;
  onPick: (i: number) => void;
  level: number;
  earned: Set<string>;
  swatch?: boolean;
}) {
  return (
    <fieldset className="opt-group">
      <legend>{title}</legend>
      <div className="opts">
        {items.map((o, i) => {
          const open = isUnlocked(o, level, earned);
          return (
            <button
              key={o.id}
              type="button"
              className={`opt${i === value ? ' on' : ''}${open ? '' : ' locked'}${swatch ? ' sw' : ''}`}
              disabled={!open}
              aria-pressed={i === value}
              title={open ? o.name : `${o.name}. ${needText(o.need)}`}
              onClick={() => onPick(i)}
            >
              {swatch && <i style={{ background: o.c }} aria-hidden="true" />}
              <span>{o.name}</span>
              {!open && <small>{needText(o.need)}</small>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function AvatarEditor() {
  const { profile } = useAuth();
  const p = usePlayer();
  const [draft, setDraft] = useState<AvatarCfg | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!p.ready) return <p className="muted mono">Memuat…</p>;

  if (!p.avatarOk) {
    return (
      <>
        <div className="crumb">
          <Link href="/dashboard" className="btn btn-sm">← Kembali</Link>
        </div>
        <div className="notice" style={{ marginTop: 24 }}>
          Fitur avatar belum aktif. Minta pengelola situs menjalankan <b>supabase/arcade2.sql</b> di Supabase.
        </div>
      </>
    );
  }

  const cfg = draft ?? p.avatar ?? DEFAULT_AVATAR;
  const lv = levelOf(p.xp);
  const set = (k: keyof AvatarCfg) => (i: number) => {
    setMsg(null);
    setDraft({ ...cfg, [k]: i });
  };
  const dirty = draft !== null;

  async function save() {
    setBusy(true);
    const ok = await p.saveAvatar(cfg);
    setBusy(false);
    if (ok) {
      setDraft(null);
      setMsg({ ok: true, text: 'Avatar tersimpan.' });
    } else setMsg({ ok: false, text: 'Avatar gagal disimpan. Coba lagi.' });
  }

  return (
    <>
      <div className="crumb">
        <Link href="/dashboard" className="btn btn-sm">← Kembali</Link>
      </div>
      <h1 className="page-title">
        Avatar <mark>pixel.</mark>
      </h1>
      <p className="lead">
        Pilih tampilan karaktermu. Item bergembok terbuka saat levelmu naik atau saat kamu mendapat lencana.
      </p>

      <div className="avatar-layout">
        <section className="card avatar-stage" aria-label="Pratinjau avatar">
          <div className="win-title" style={{ ['--c' as string]: 'var(--cyan)' }}>Pratinjau</div>
          <div className="avatar-frame">
            <AvatarArt cfg={cfg} size={224} label={`Avatar ${profile?.full_name ?? ''}`} />
          </div>
          <div className="avatar-meta">
            <b>{profile?.full_name}</b>
            <span>
              LV {lv.level} · {titleOf(lv.level)}
            </span>
          </div>
          {msg && (
            <div className={`notice ${msg.ok ? 'ok' : 'err'}`} role="status" style={{ margin: '0 18px 14px' }}>
              {msg.text}
            </div>
          )}
          <div className="avatar-actions">
            <button type="button" className="btn btn-green" onClick={save} disabled={busy || (!dirty && !!p.avatar)}>
              {busy ? 'Menyimpan…' : p.avatar && !dirty ? 'Tersimpan' : 'Simpan avatar'}
            </button>
            {dirty && (
              <button type="button" className="btn btn-sm" onClick={() => setDraft(null)}>
                Batal
              </button>
            )}
          </div>
        </section>

        <div className="card card-pad avatar-opts">
          <Group title="Warna kulit" items={SKIN.map((c, i) => ({ id: `s${i}`, name: `Kulit ${i + 1}`, c }))} value={cfg.s} onPick={set('s')} level={lv.level} earned={p.earned} swatch />
          <Group title="Gaya rambut" items={HAIR_STYLES} value={cfg.h} onPick={set('h')} level={lv.level} earned={p.earned} />
          <Group title="Warna rambut" items={HAIR_COLORS} value={cfg.hc} onPick={set('hc')} level={lv.level} earned={p.earned} swatch />
          <Group title="Baju" items={OUTFITS} value={cfg.o} onPick={set('o')} level={lv.level} earned={p.earned} />
          <Group title="Warna baju" items={OUTFIT_COLORS} value={cfg.oc} onPick={set('oc')} level={lv.level} earned={p.earned} swatch />
          <Group title="Aksesori" items={ACCESSORIES} value={cfg.a} onPick={set('a')} level={lv.level} earned={p.earned} />
          <Group title="Latar" items={BACKGROUNDS} value={cfg.b} onPick={set('b')} level={lv.level} earned={p.earned} swatch />
        </div>
      </div>
    </>
  );
}
