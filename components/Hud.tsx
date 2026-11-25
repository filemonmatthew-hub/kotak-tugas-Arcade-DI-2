import Link from 'next/link';
import PixelIcon from './PixelIcon';
import AvatarArt from './AvatarArt';
import type { AvatarCfg } from '@/lib/avatar';
import { initials } from '@/lib/format';
import { badgesOf, levelOf, titleOf, XP_PER_LEVEL, type Badge } from '@/lib/arcade';

export function XpBar({ pct }: { pct: number }) {
  const on = Math.round((pct / 100) * 20);
  return (
    <div className="xpbar" role="img" aria-label={`Kemajuan level ${pct} persen`}>
      {Array.from({ length: 20 }, (_, i) => (
        <i key={i} className={i < on ? 'on' : ''} />
      ))}
    </div>
  );
}

/** Kartu pemain: avatar, level, bilah XP, dan kombo. */
export default function Hud({ name, xp, combo, color = 'pink', avatar, avatarLink = false }: { name: string; xp: number; combo: number; color?: string; avatar?: AvatarCfg | null; avatarLink?: boolean }) {
  const lv = levelOf(xp);
  return (
    <section className="hud" aria-label="Status pemain">
      <div className="hud-avatar-col">
        {avatar ? (
          <div className="hud-avatar pix">
            <AvatarArt cfg={avatar} size={84} label={`Avatar ${name}`} />
          </div>
        ) : (
          <div className={`hud-avatar c-${color}`} aria-hidden="true">
            {initials(name)}
          </div>
        )}
        {avatarLink && (
          <Link href="/avatar" className="hud-avatar-link">
            {avatar ? 'Ganti avatar' : 'Buat avatar'}
          </Link>
        )}
      </div>
      <div className="hud-main">
        <p className="hud-name">{name}</p>
        <div className="hud-rank">
          <span className="lv">LV {lv.level}</span>
          <span className="title">{titleOf(lv.level)}</span>
        </div>
        <XpBar pct={lv.pct} />
        <div className="xp-line">
          <span>
            XP <b>{xp}</b>
          </span>
          <span>
            {lv.into} / {XP_PER_LEVEL} ke LV {lv.level + 1}
          </span>
        </div>
      </div>
      <div className="hud-combo" title="Tugas berturut-turut yang disetor tepat waktu">
        <PixelIcon name="flame" size={30} color={combo > 0 ? undefined : '#4a4a8a'} />
        <p className="n">x{combo}</p>
        <p className="xp-line" style={{ justifyContent: 'center', marginTop: 8 }}>
          KOMBO
        </p>
      </div>
    </section>
  );
}

export function BadgeRow({ badges }: { badges: Badge[] }) {
  return (
    <div className="badges">
      {badges.map((b) => (
        <div key={b.id} className={`badge-item${b.earned ? ' on' : ''}`} title={b.hint}>
          <span className="ico">
            <PixelIcon name={b.icon} size={24} />
          </span>
          <span style={{ minWidth: 0 }}>
            <b>{b.name}</b>
            <small>{b.earned ? 'Didapat' : b.hint}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

export { badgesOf };
