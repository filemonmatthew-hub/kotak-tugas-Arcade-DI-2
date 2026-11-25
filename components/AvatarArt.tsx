import { avatarRects, type AvatarCfg } from '@/lib/avatar';

/** Menggambar avatar pixel 16 x 16 sebagai SVG. */
export default function AvatarArt({ cfg, size = 84, label = 'Avatar pixel' }: { cfg: AvatarCfg; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      style={{ display: 'block' }}
    >
      {avatarRects(cfg).map(({ r, f }, i) => (
        <rect key={i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} fill={f} />
      ))}
    </svg>
  );
}
