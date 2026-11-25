import Link from 'next/link';
import PixelIcon from './PixelIcon';

export function LogoMark() {
  return <PixelIcon name="coin" size={34} />;
}

export default function Logo({ href = '/', tagline = true }: { href?: string; tagline?: boolean }) {
  return (
    <Link href={href} className="logo" aria-label="Kotak Tugas, ke beranda">
      <LogoMark />
      <span>
        <b>KOTAK TUGAS</b>
        {tagline && <small>Setor · Nilai · Level up</small>}
      </span>
    </Link>
  );
}
