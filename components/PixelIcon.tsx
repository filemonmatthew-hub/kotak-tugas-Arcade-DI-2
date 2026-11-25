/** Ikon pixel kecil. Tiap huruf X menjadi satu kotak. */
const ART: Record<string, string[]> = {
  coin: ['..XXXX..', '.XX..XX.', 'XX.XX.XX', 'XX.XX.XX', 'XX.XX.XX', 'XX.XX.XX', '.XX..XX.', '..XXXX..'],
  clock: ['..XXXX..', '.X....X.', 'X..X...X', 'X..X...X', 'X..XXX.X', 'X......X', '.X....X.', '..XXXX..'],
  flame: ['...X....', '..XX.X..', '..XXXX..', '.XXXXXX.', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.'],
  star: ['...XX...', '...XX...', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '.XXXXXX.', '.XX..XX.', '.X....X.'],
  crown: ['X..XX..X', 'XX.XX.XX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '.XXXXXX.'],
  skull: ['.XXXXXX.', 'XXXXXXXX', 'XX.XX.XX', 'XX.XX.XX', 'XXXXXXXX', '.XXXXXX.', '.X.XX.X.', '.XXXXXX.'],
  brush: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XXXXXXXX', 'XXXX.XXX', '.XXXXXX.', '..XXXX..'],
  trophy: ['XXXXXXXX', 'X.XXXX.X', 'X.XXXX.X', '.XXXXXX.', '..XXXX..', '...XX...', '...XX...', '..XXXX..'],
  cart: ['.XXXXXXX.', 'X.......X', 'X.XXXXX.X', 'X.XXXXX.X', 'X.......X', 'XXXXXXXXX', 'X.X.X.X.X'],
};

export type PixelName = keyof typeof ART;

const COLORS: Record<string, string> = {
  coin: '#ffe14d',
  clock: '#22e3ff',
  flame: '#ff8a2a',
  star: '#ffe14d',
  crown: '#ff3ea5',
  cart: '#b18cff',
  skull: '#e8e8f0',
  brush: '#ff3ea5',
  trophy: '#ffe14d',
};

export default function PixelIcon({ name, size = 32, color }: { name: PixelName; size?: number; color?: string }) {
  const rows = ART[name];
  const w = rows[0].length;
  const fill = color ?? COLORS[name] ?? '#fff';
  const rects: React.ReactNode[] = [];
  rows.forEach((r, y) => {
    [...r].forEach((c, x) => {
      if (c === 'X') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    });
  });
  return (
    <svg
      width={size}
      height={(size * rows.length) / w}
      viewBox={`0 0 ${w} ${rows.length}`}
      fill={fill}
      shapeRendering="crispEdges"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {rects}
    </svg>
  );
}
