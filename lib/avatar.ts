/*
 * Avatar pixel. Kanvas 16 x 16 kotak. Pilihan disimpan sebagai angka indeks (JSON pendek) di profil.
 * Item terkunci dibuka lewat level atau lencana. Ini hanya hiasan, jadi dibuka di sisi tampilan saja.
 */

export type Rect = [number, number, number, number];

export interface Need {
  lv?: number;
  badge?: string;
}

export interface Opt {
  id: string;
  name: string;
  need?: Need;
}

export interface AvatarCfg {
  s: number; // kulit
  h: number; // gaya rambut
  hc: number; // warna rambut
  o: number; // baju
  oc: number; // warna baju
  a: number; // aksesori
  b: number; // latar
}

export const SKIN = ['#f8d5b8', '#eab88a', '#c98b5c', '#9a6038', '#5c3a21'];

export const HAIR_COLORS: (Opt & { c: string })[] = [
  { id: 'hc0', name: 'Hitam', c: '#2b1b12' },
  { id: 'hc1', name: 'Cokelat', c: '#6b3f1d' },
  { id: 'hc2', name: 'Pirang', c: '#d9a441' },
  { id: 'hc3', name: 'Merah', c: '#c0392b' },
  { id: 'hc4', name: 'Perak', c: '#e8e8f0' },
  { id: 'hc5', name: 'Pink neon', c: '#ff3ea5', need: { lv: 5 } },
  { id: 'hc6', name: 'Cyan neon', c: '#22e3ff', need: { lv: 8 } },
];

export const OUTFIT_COLORS: (Opt & { c: string })[] = [
  { id: 'oc0', name: 'Pink', c: '#ff3ea5' },
  { id: 'oc1', name: 'Cyan', c: '#22e3ff' },
  { id: 'oc2', name: 'Kuning', c: '#ffe14d' },
  { id: 'oc3', name: 'Hijau', c: '#4dff9a' },
  { id: 'oc4', name: 'Ungu', c: '#b18cff' },
  { id: 'oc5', name: 'Putih', c: '#f3f0ff' },
];

export const BACKGROUNDS: (Opt & { c: string })[] = [
  { id: 'b0', name: 'Malam', c: '#1b1b4a' },
  { id: 'b1', name: 'Pink', c: '#ff3ea5' },
  { id: 'b2', name: 'Cyan', c: '#22e3ff' },
  { id: 'b3', name: 'Hijau', c: '#4dff9a', need: { lv: 2 } },
  { id: 'b4', name: 'Jingga', c: '#ff8a2a', need: { lv: 4 } },
  { id: 'b5', name: 'Emas', c: '#ffe14d', need: { lv: 6 } },
];

export const HAIR_STYLES: (Opt & { r: Rect[] })[] = [
  { id: 'h0', name: 'Pendek', r: [[5, 2, 6, 2], [4, 3, 1, 3], [11, 3, 1, 3]] },
  { id: 'h1', name: 'Panjang', r: [[5, 2, 6, 2], [4, 3, 1, 7], [11, 3, 1, 7]] },
  { id: 'h2', name: 'Jabrik', r: [[5, 2, 6, 2], [5, 0, 1, 2], [7, 0, 2, 2], [10, 0, 1, 2], [4, 3, 1, 2], [11, 3, 1, 2]], need: { lv: 2 } },
  { id: 'h3', name: 'Cepol', r: [[5, 2, 6, 2], [4, 3, 1, 2], [11, 3, 1, 2], [7, 0, 2, 2]], need: { lv: 3 } },
  { id: 'h4', name: 'Mohawk', r: [[7, 0, 2, 4], [6, 3, 4, 1]], need: { lv: 4 } },
  { id: 'h5', name: 'Afro', r: [[3, 1, 10, 3], [3, 4, 2, 4], [11, 4, 2, 4]], need: { lv: 6 } },
  { id: 'h6', name: 'Botak', r: [] },
];

interface OutfitDef extends Opt {
  /** badan, ditulis dengan warna baju */
  body: Rect[];
  /** lengan, ditulis dengan warna baju */
  arms: Rect[];
  /** lengan yang terlihat kulit */
  skinArms: Rect[];
  /** detail gelap */
  dark: Rect[];
  /** detail terang */
  light: Rect[];
}

export const OUTFITS: OutfitDef[] = [
  {
    id: 'o0', name: 'Kaos',
    body: [[4, 10, 8, 6]], arms: [[3, 10, 1, 2], [12, 10, 1, 2]], skinArms: [[3, 12, 1, 3], [12, 12, 1, 3]],
    dark: [], light: [],
  },
  {
    id: 'o1', name: 'Hoodie',
    body: [[4, 9, 8, 7]], arms: [[3, 10, 1, 5], [12, 10, 1, 5]], skinArms: [],
    dark: [[7, 9, 2, 1]], light: [[6, 11, 1, 3], [9, 11, 1, 3]],
  },
  {
    id: 'o2', name: 'Jaket', need: { lv: 3 },
    body: [[4, 10, 8, 6]], arms: [[3, 10, 1, 5], [12, 10, 1, 5]], skinArms: [],
    dark: [[7, 10, 2, 6]], light: [[4, 10, 2, 1], [10, 10, 2, 1]],
  },
  {
    id: 'o3', name: 'Zirah', need: { lv: 5 },
    body: [[4, 10, 8, 6]], arms: [[3, 10, 1, 5], [12, 10, 1, 5]], skinArms: [],
    dark: [[4, 13, 8, 1]], light: [[4, 10, 8, 1], [6, 11, 4, 1], [3, 10, 1, 1], [12, 10, 1, 1]],
  },
  {
    id: 'o4', name: 'Jubah', need: { lv: 7 },
    body: [[3, 10, 10, 6]], arms: [[2, 10, 1, 5], [13, 10, 1, 5]], skinArms: [],
    dark: [[7, 10, 2, 6]], light: [[7, 12, 2, 1], [6, 13, 1, 1], [9, 13, 1, 1]],
  },
];

export const ACCESSORIES: Opt[] = [
  { id: 'a0', name: 'Polos' },
  { id: 'a1', name: 'Kacamata hitam' },
  { id: 'a2', name: 'Baret', need: { lv: 2 } },
  { id: 'a3', name: 'Headphone', need: { lv: 4 } },
  { id: 'a4', name: 'Pin bintang', need: { badge: 'rank-s' } },
  { id: 'a5', name: 'Pin api', need: { badge: 'combo' } },
  { id: 'a6', name: 'Pin palet', need: { badge: 'art' } },
  { id: 'a7', name: 'Helm tanduk', need: { badge: 'boss' } },
  { id: 'a8', name: 'Pin piala', need: { badge: 'win' } },
  { id: 'a9', name: 'Mahkota', need: { badge: 'all' } },
];

export const DEFAULT_AVATAR: AvatarCfg = { s: 1, h: 0, hc: 1, o: 0, oc: 1, a: 0, b: 0 };

const LIMITS: Record<keyof AvatarCfg, number> = {
  s: SKIN.length,
  h: HAIR_STYLES.length,
  hc: HAIR_COLORS.length,
  o: OUTFITS.length,
  oc: OUTFIT_COLORS.length,
  a: ACCESSORIES.length,
  b: BACKGROUNDS.length,
};

/** Baca teks JSON dari database. Nilai yang rusak atau di luar batas diganti nilai bawaan. */
export function parseAvatar(raw: string | null | undefined): AvatarCfg | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out = { ...DEFAULT_AVATAR };
    (Object.keys(LIMITS) as (keyof AvatarCfg)[]).forEach((k) => {
      const v = o[k];
      if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < LIMITS[k]) out[k] = v;
    });
    return out;
  } catch {
    return null;
  }
}

export function serializeAvatar(c: AvatarCfg): string {
  return JSON.stringify({ s: c.s, h: c.h, hc: c.hc, o: c.o, oc: c.oc, a: c.a, b: c.b });
}

export function isUnlocked(opt: Opt, level: number, earned: Set<string>): boolean {
  if (!opt.need) return true;
  if (opt.need.lv != null && level < opt.need.lv) return false;
  if (opt.need.badge != null && !earned.has(opt.need.badge)) return false;
  return true;
}

const BADGE_NAMES: Record<string, string> = {
  first: 'PERTAMA',
  ontime: 'TEPAT WAKTU',
  combo: 'KOMBO X3',
  'rank-s': 'SKOR S',
  all: 'KOLEKTOR',
  boss: 'PEMBURU BOSS',
  art: 'SENIMAN',
  win: 'JUARA',
};

export function needText(n?: Need): string {
  if (!n) return '';
  if (n.lv != null) return `Terbuka di LV ${n.lv}`;
  if (n.badge) return `Butuh lencana ${BADGE_NAMES[n.badge] ?? n.badge}`;
  return '';
}

/** Daftar kotak untuk digambar, berurutan dari belakang ke depan. */
export function avatarRects(c: AvatarCfg): { r: Rect; f: string }[] {
  const skin = SKIN[c.s];
  const hair = HAIR_COLORS[c.hc].c;
  const oc = OUTFIT_COLORS[c.oc].c;
  const of = OUTFITS[c.o];
  const out: { r: Rect; f: string }[] = [];
  const add = (rs: Rect[], f: string) => rs.forEach((r) => out.push({ r, f }));

  add([[0, 0, 16, 16]], BACKGROUNDS[c.b].c);
  // garis tepi gelap tipis supaya baju dan kulit tetap terlihat di latar warna yang mirip
  const edge = (rs: Rect[]) => rs.forEach((r) => out.push({ r: [r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2], f: 'rgba(5,5,25,0.6)' }));
  edge(of.body);
  edge(of.arms);
  edge(of.skinArms);
  edge([[5, 3, 6, 6], [4, 5, 1, 2], [11, 5, 1, 2]]);
  add(of.skinArms, skin);
  add(of.body, oc);
  add(of.arms, oc);
  add(of.dark, 'rgba(0,0,0,0.35)');
  add(of.light, 'rgba(255,255,255,0.7)');
  // leher dan kepala
  add([[7, 9, 2, 1]], skin);
  add([[5, 3, 6, 6], [4, 5, 1, 2], [11, 5, 1, 2]], skin);
  // mata dan mulut
  add([[6, 6, 1, 1], [9, 6, 1, 1]], '#141432');
  add([[7, 8, 2, 1]], 'rgba(0,0,0,0.35)');
  // rambut
  add(HAIR_STYLES[c.h].r, hair);

  switch (ACCESSORIES[c.a].id) {
    case 'a1':
      add([[5, 6, 6, 1], [5, 5, 2, 1], [9, 5, 2, 1]], '#0b0b1f');
      break;
    case 'a2':
      add([[4, 2, 8, 1], [5, 1, 6, 1]], '#c2185b');
      add([[7, 0, 2, 1]], '#ff7fc0');
      break;
    case 'a3':
      add([[4, 2, 8, 1], [3, 4, 2, 3], [11, 4, 2, 3]], '#141432');
      add([[3, 5, 1, 1], [12, 5, 1, 1]], '#ff3ea5');
      break;
    case 'a4':
      add([[10, 11, 2, 2], [9, 12, 4, 1], [10, 13, 1, 1], [11, 13, 1, 1]], '#ffe14d');
      break;
    case 'a5':
      add([[10, 11, 1, 1], [9, 12, 3, 2], [10, 14, 1, 1]], '#ff8a2a');
      break;
    case 'a6':
      add([[9, 11, 3, 3], [10, 10, 1, 1]], '#ff3ea5');
      add([[10, 12, 1, 1]], '#0b0b1f');
      break;
    case 'a7':
      add([[4, 1, 1, 2], [11, 1, 1, 2], [5, 2, 6, 1], [4, 3, 1, 1], [11, 3, 1, 1]], '#c9c9e8');
      add([[3, 0, 1, 2], [12, 0, 1, 2]], '#ffe14d');
      break;
    case 'a8':
      add([[9, 11, 3, 1], [10, 12, 1, 1], [9, 13, 3, 1]], '#ffe14d');
      break;
    case 'a9':
      add([[5, 1, 6, 2], [5, 0, 1, 1], [7, 0, 2, 1], [10, 0, 1, 1]], '#ffb300');
      add([[7, 2, 2, 1]], '#ff3ea5');
      break;
  }
  return out;
}
