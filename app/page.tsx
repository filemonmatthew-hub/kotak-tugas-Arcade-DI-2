import Logo from '@/components/Logo';
import PixelIcon from '@/components/PixelIcon';
import { NavActions, HeroActions } from '@/components/LandingAuth';
import { XP_ON_TIME, XP_PER_LEVEL, XP_SUBMIT } from '@/lib/arcade';

const TICKER = [
  'PLAYER 1 READY',
  `SETOR TUGAS +${XP_SUBMIT} XP`,
  `TEPAT WAKTU +${XP_ON_TIME} XP`,
  'NILAI DOSEN SAMPAI +100 XP',
  `${XP_PER_LEVEL} XP = 1 LEVEL`,
  'RAIH PERINGKAT S',
];

const SAMPLE = [
  { ini: 'AYU', xp: 1180 },
  { ini: 'RDK', xp: 1045 },
  { ini: 'NAB', xp: 990 },
  { ini: 'MFT', xp: 870 },
  { ini: 'SLV', xp: 815 },
];

export default function Home() {
  return (
    <>
      <div className="wrap">
        <header className="top">
          <Logo />
          <NavActions />
        </header>

        <section className="hero">
          <div>
            <span className="eyebrow">1 pemain · kelas desain</span>
            <h1>
              Setor karya.
              <br />
              Kumpulkan <span className="hl">XP.</span>
              <br />
              Naik level.
            </h1>
            <p className="lead">
              Tempat mahasiswa desain menyetor poster, UI, dan proyek akhir. Dosen melihat semuanya dalam satu galeri, memberi
              nilai, lalu menulis umpan balik.
            </p>
            <p className="insert">▶ INSERT COIN</p>
            <HeroActions />
          </div>

          <div className="crt" aria-label="Contoh papan skor">
            <p className="crt-title">TOP SKOR KELAS</p>
            <ol className="board">
              {SAMPLE.map((r, i) => (
                <li key={r.ini}>
                  <span className="pos">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ini">{r.ini}</span>
                  <span className="dots" aria-hidden="true" />
                  <span className="xp">{r.xp} XP</span>
                </li>
              ))}
            </ol>
            <p className="crt-note">CONTOH TAMPILAN</p>
          </div>
        </section>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((n) => (
            <span key={n} style={{ display: 'inline-flex', gap: 40 }}>
              {TICKER.map((t) => (
                <span key={t}>{t} ★</span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="wrap">
        <section className="feat">
          <article style={{ ['--c' as string]: 'var(--pink)' }}>
            <span className="num">01 · SETOR</span>
            <div>
              <h3>Masukkan koin, setor karya</h3>
              <p>
                Unggah gambar, PDF, atau video. Karya besar di Figma? Tempel tautannya. Tenggat dicek di server, bukan jam HP.
              </p>
            </div>
            <PixelIcon name="coin" size={36} />
          </article>
          <article style={{ ['--c' as string]: 'var(--cyan)' }}>
            <span className="num">02 · NILAI</span>
            <div>
              <h3>Peringkat S sampai D</h3>
              <p>
                Nilai dari dosen berubah jadi peringkat huruf dan XP, lengkap dengan pesan umpan balik di kotak dialog.
              </p>
            </div>
            <PixelIcon name="star" size={36} />
          </article>
          <article style={{ ['--c' as string]: 'var(--green)' }}>
            <span className="num">03 · LEVEL UP</span>
            <div>
              <h3>Kombo dan lencana</h3>
              <p>
                Setor tepat waktu berturut-turut untuk menyalakan kombo, kumpulkan lencana, dan lihat posisimu di papan skor kelas.
              </p>
            </div>
            <PixelIcon name="flame" size={36} />
          </article>
        </section>

        <section className="roles">
          <div className="role-card">
            <h3>MAHASISWA</h3>
            <ul>
              <li>Lihat semua tugas sebagai kaset lengkap dengan sisa waktu</li>
              <li>Unggah berkas atau tempel tautan Figma, Behance, Drive</li>
              <li>Kumpul ulang selama belum dinilai</li>
              <li>Baca nilai dan pesan dosen, lalu pantau XP dan levelmu</li>
            </ul>
          </div>
          <div className="role-card dark">
            <h3>DOSEN</h3>
            <ul>
              <li>Buat tugas dengan brief, tenggat, dan nilai maksimal</li>
              <li>Periksa pengumpulan dalam tampilan galeri</li>
              <li>Beri nilai dan umpan balik langsung di kartu karya</li>
              <li>Unduh rekap nilai kelas ke berkas CSV</li>
            </ul>
          </div>
        </section>

        <section className="cta-band">
          <h2>Siap main?</h2>
          <HeroActions tone="sun" />
        </section>

        <footer className="foot">
          <span>KOTAK TUGAS · DIBUAT UNTUK KELAS DESAIN</span>
          <span>SEMUA JAM DALAM WIB</span>
        </footer>
      </div>
    </>
  );
}
