// ============================================================
// src/templates/themes/MotionFlowTheme.tsx
// ------------------------------------------------------------
// Tema Undangan: Motion Flow (Kategori: RSVP)
// Konsep       : "Penuh Gerak" — tema beranimasi intensif berbasis
//                framer-motion. Amplop interaktif, aurora background,
//                parallax hero, marquee, stagger reveal, countdown flip,
//                shared-element lightbox & tombol magnetik.
// Warna        : palet MILIK TEMA sendiri, didefinisikan di @theme src/index.css
//                (--color-mf-deep #3D1832 plum gelap, --color-mf-cream #FFEDDF
//                 ivory, --color-mf-ink #2B1122 ink, --color-mf-muted #A28EA6
//                 mauve, --color-mf-rose #D65A73 rose).
//                Sengaja TIDAK memakai token --color-brand-* (milik halaman
//                utama) agar tema tetap konsisten saat warna situs berubah.
// Dipakai di   : templates/Registry.ts
// Keterikatan  : types/template, types/database, utils/templateHelpers,
//                hooks/useCountdown, hooks/useCopyToClipboard,
//                templates/shared/useOpenInvitation, framer-motion
// ============================================================

import { useRef, useState, type ReactNode } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Heart,
  Gift,
  CheckCircle2,
  Copy,
  Music,
  ChevronDown,
  Sparkles,
  X,
  Send,
  MessageCircle,
  Users,
  Check,
  Navigation,
} from 'lucide-react';
import type { TemplateProps, RsvpPayload } from '../../types/template';
import type { RsvpRow, RsvpStatus } from '../../types/database';
import { useCountdown } from '../../hooks/useCountdown';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import {
  formatDate,
  resolveBanks,
  resolveGallery,
  resolvePhotos,
  resolveVenue,
  resolveSchedule,
} from '../../utils/templateHelpers';
import { useOpenInvitation } from '../shared/useOpenInvitation';

// ─── Motion vocabulary: satu sumber easing & varian agar ritme konsisten ───
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Wrapper scroll-reveal generik untuk semua section. */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function MotionFlowTheme({
  groom,
  bride,
  date,
  guestName,
  orderId,
  onRsvpSubmit,
  submittedData,
  data,
}: TemplateProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const copyToClipboard = useCopyToClipboard();

  // Amplop & pemutar musik (pola bersama antar-tema)
  const { isOpen, open, playing: isPlaying, toggle: toggleAudio } = useOpenInvitation(audioRef, 900);

  // Data resolusi dengan fallback cerdas (utilitas bersama antar-tema)
  const photos = resolvePhotos(data);
  const gallery = resolveGallery(data);
  const banks = resolveBanks(data);
  const venue = resolveVenue(data);
  const schedule = resolveSchedule(data, date);

  const quote =
    data?.quote ||
    'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya.';
  const quoteSrc = data?.quote_src || 'QS. Ar-Rum: 21';
  const audioUrl = data?.audio_url || 'https://r2.loverse.id/defaults/audio/ee2e74c72c.mp3';

  const groomParents = data?.groom_parents || 'Bpk. Capulet & Ibu Capulet';
  const brideParents = data?.bride_parents || 'Bpk. Montague & Ibu Montague';

  const formattedDate = formatDate(date, 'id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const akadClock = (schedule.akadTime || '08:00').split(' ')[0].substring(0, 5);
  const timeLeft = useCountdown(date, akadClock);

  // Tanggal per-acara diformat penuh (bukan string mentah dari form)
  const formatDateId = (value?: string) =>
    formatDate(value || date, 'id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  const formattedAkadDate = formatDateId(schedule.akadDate);
  const formattedResepsiDate = formatDateId(schedule.resepsiDate);

  // Parallax hero: foto bergeser lebih lambat dari scroll (efek depth)
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  });
  const coverY = useSpring(useTransform(heroProgress, [0, 1], ['-12%', '12%']), {
    stiffness: 60,
    damping: 20,
  });

  // Status UI
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  const activeImage = activeImageIdx !== null ? gallery[activeImageIdx] : null;
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Status Form RSVP
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(submittedData?.status || 'hadir');
  const [rsvpPax, setRsvpPax] = useState<number>(submittedData?.pax || 1);
  const [rsvpName, setRsvpName] = useState<string>(submittedData?.guest_name || guestName || '');
  const [rsvpMessage, setRsvpMessage] = useState<string>(submittedData?.message || '');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(Boolean(submittedData));

  // Ucapan doa (wishes wall) + optimistic update
  const [wishesList, setWishesList] = useState<RsvpRow[]>(() => data?.rsvps || []);

  const handleCopyRekening = (number: string, bankName: string, idx: number) => {
    copyToClipboard(number, `Nomor Rekening ${bankName}`);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;

    setIsSubmittingRsvp(true);
    const payload: RsvpPayload = {
      status: rsvpStatus,
      pax: Number(rsvpPax),
      message: rsvpMessage.trim(),
    };

    try {
      if (onRsvpSubmit) await onRsvpSubmit(payload);
      if (rsvpMessage.trim()) {
        const newWish: RsvpRow = {
          id: String(Date.now()),
          order_id: orderId || 'demo',
          session_id: 'local',
          guest_name: rsvpName.trim(),
          status: rsvpStatus,
          pax: Number(rsvpPax),
          message: rsvpMessage.trim(),
          created_at: new Date().toISOString(),
        };
        setWishesList((prev) => [newWish, ...prev]);
      }
      setRsvpSuccess(true);
    } catch (err) {
      console.error('Gagal mengirim RSVP:', err);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  return (
    <div className="min-h-screen bg-mf-cream text-mf-ink font-sans relative overflow-x-hidden selection:bg-mf-rose selection:text-mf-cream">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,400;1,600&display=swap');
        .font-flow-display { font-family: 'Playfair Display', serif; }

        /* Teks shimmer memakai palet milik tema Motion Flow */
        .flow-shimmer-text {
          background: linear-gradient(90deg, var(--color-mf-deep) 0%, var(--color-mf-rose) 50%, var(--color-mf-deep) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: flow-shimmer 5s infinite linear;
        }
        @keyframes flow-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .flow-marquee-track {
          display: inline-flex;
          white-space: nowrap;
          animation: flow-marquee 22s linear infinite;
        }
        @keyframes flow-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      {/* Audio latar */}
      <audio ref={audioRef} src={audioUrl} loop preload="auto" />

      {/* ─── AURORA BACKGROUND: blob warna palet tema yang mengambang terus-menerus ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl opacity-40 bg-mf-rose"
          animate={{ x: [0, 60, -30, 0], y: [0, 40, 80, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-28 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-30 bg-mf-cream"
          animate={{ x: [0, -70, 30, 0], y: [0, -50, 40, 0], scale: [1, 0.9, 1.2, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute bottom-[-6rem] left-1/4 w-80 h-80 rounded-full blur-3xl opacity-25 bg-mf-muted"
          animate={{ x: [0, 50, -50, 0], y: [0, -60, 20, 0], scale: [1, 1.1, 1.05, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />

        {/* Partikel hati kecil melayang ke atas — kelopak "flow" khas tema */}
        {[...Array(9)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-mf-rose/50"
            style={{ left: `${8 + i * 10}%` }}
            initial={{ y: '105vh', opacity: 0 }}
            animate={{
              y: '-12vh',
              opacity: [0, 1, 1, 0],
              rotate: [0, i % 2 === 0 ? 180 : -180],
            }}
            transition={{
              duration: 16 + (i % 5) * 3,
              repeat: Infinity,
              delay: i * 2.2,
              ease: 'linear',
            }}
          >
            <Heart size={14 + (i % 3) * 6} fill="currentColor" strokeWidth={0} />
          </motion.div>
        ))}
      </div>

      {/* ─── AMPLOP PEMBUKA (AnimatePresence exit) ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="envelope"
            role="region"
            aria-label="Undangan"
            className="fixed inset-0 z-50 flex items-center justify-center bg-mf-deep"
            initial={{ opacity: 1 }}
            exit={{ y: '-100%', borderBottomLeftRadius: '50%', borderBottomRightRadius: '50%' }}
            transition={{ duration: 1, ease: EASE_OUT }}
          >
            {/* Kilau latar amplop */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{ backgroundPositionX: ['0%', '200%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{
                backgroundImage:
                  'linear-gradient(115deg, transparent 40%, var(--color-mf-cream) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
              }}
            />

            <div className="relative text-center px-8">
              <motion.p
                className="text-mf-cream/80 text-xs sm:text-sm uppercase tracking-[0.35em]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: EASE_OUT }}
              >
                The Wedding Of
              </motion.p>

              <motion.h1
                className="font-flow-display font-bold text-5xl sm:text-7xl mt-4 leading-tight"
                initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.5, duration: 1, ease: EASE_OUT }}
              >
                <span className="flow-shimmer-text">
                  {groom} &amp; {bride}
                </span>
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.9, ease: EASE_OUT }}
                className="h-px w-48 mx-auto my-6 bg-gradient-to-r from-transparent via-mf-rose to-transparent"
              />

              <motion.button
                onClick={open}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                cursor-pointer
                className="mt-2 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-mf-cream text-mf-ink font-semibold shadow-xl shadow-black/30 relative overflow-hidden group"
              >
                <motion.span
                  className="absolute inset-0 bg-white/25"
                  animate={{ x: ['-120%', '120%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
                />
                <motion.span
                  className="relative flex items-center gap-2"
                  animate={{ rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.2 }}
                >
                  <Sparkles size={18} />
                  Buka Undangan
                </motion.span>
              </motion.button>

              {guestName && (
                <motion.p
                  className="mt-6 text-mf-cream/70 text-sm italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                >
                  Kepada Yth. <span className="font-semibold not-italic">{guestName}</span>
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── TOMBOL MUSIK MENGAMBANG ─── */}
      <motion.button
        onClick={toggleAudio}
        aria-label={isPlaying ? 'Pause musik' : 'Putar musik'}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-mf-deep text-mf-cream border border-mf-rose/50 shadow-lg flex items-center justify-center cursor-pointer"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? [1, 1.15] : 0 }}
        whileHover={{ scale: 1.18, rotate: 10 }}
        whileTap={{ scale: 0.88 }}
        transition={{
          delay: isOpen ? 0.4 : 0,
          duration: 0.4,
          scale: isPlaying ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut', delay: isOpen ? 0.4 : 0 } : undefined,
        }}
      >
        <Music size={18} />
      </motion.button>

      <main className="relative z-10 max-w-2xl mx-auto px-5 pb-20">
        {/* ─── SECTION 1: HERO + PARALLAX COVER ─── */}
        <section ref={heroRef} className="pt-16 pb-10 text-center relative">
          <motion.p
            className="text-mf-muted uppercase tracking-[0.4em] text-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 20 }}
            transition={{ delay: 1.1, duration: 0.8, ease: EASE_OUT }}
          >
            We Found Love
          </motion.p>

          <motion.h2
            className="font-flow-display font-bold text-5xl sm:text-6xl mt-3 leading-tight"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 30, scale: isOpen ? 1 : 0.95 }}
            transition={{ delay: 1.25, duration: 0.9, ease: EASE_OUT }}
          >
            {groom}
            <motion.span
              className="inline-block text-mf-rose mx-3"
              animate={{ scale: [1, 1.25, 1], rotate: [0, 12, -12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              &amp;
            </motion.span>
            {bride}
          </motion.h2>

          <motion.p
            className="mt-3 text-sm text-mf-ink/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {formattedDate}
          </motion.p>

          {/* Foto cover dengan parallax depth (bergersak lebih lambat dari scroll) */}
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] mt-8 rounded-[2rem] overflow-hidden shadow-2xl shadow-mf-deep/30 border-4 border-mf-cream/80 ring-1 ring-mf-rose/40 bg-mf-deep/90">
            <motion.img
              src={photos.cover}
              alt={`${groom} & ${bride}`}
              style={{ y: coverY }}
              className="absolute inset-0 w-full h-[120%] object-cover object-center -top-[10%]"
              initial={{ scale: 1.15 }}
              animate={{ scale: isOpen ? 1 : 1.15 }}
              transition={{ delay: 1, duration: 1.6, ease: EASE_OUT }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-mf-deep/50 via-transparent to-transparent pointer-events-none" />

            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-mf-cream flex flex-col items-center gap-1"
              animate={{ y: [0, 8, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
              <ChevronDown size={18} />
            </motion.div>
          </div>
        </section>

        {/* ─── MARQUEE BAND: teks berjalan tak berujung ─── */}
        <div className="overflow-hidden -mx-5 py-3 bg-mf-deep text-mf-cream border-y border-mf-rose/30 rotate-[-1.2deg] my-2 select-none">
          <div className="flow-marquee-track gap-8 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase">
            {[...Array(2)].map((_, half) => (
              <span key={half} className="inline-flex items-center gap-8">
                {[groom, '♥', bride, '♥', formattedDate.split(',')[1] ?? formattedDate, '♥', 'Save The Date', '♥'].map(
                  (word, i) => (
                    <span key={i} className={word === '♥' ? 'text-mf-rose' : ''}>
                      {word === '♥' ? '❤' : word}
                    </span>
                  ),
                )}
              </span>
            ))}
          </div>
        </div>

        {/* ─── SECTION 2: QUOTE (scroll reveal) ─── */}
        <Reveal className="py-10">
          <div className="relative bg-white/55 backdrop-blur-md border border-mf-rose/25 rounded-3xl p-7 shadow-lg text-center">
            <motion.div
              className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-mf-rose text-mf-cream flex items-center justify-center shadow-lg"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart size={18} fill="currentColor" strokeWidth={0} />
            </motion.div>
            <p className="font-flow-display italic text-base sm:text-lg leading-relaxed mt-3">
              “{quote}”
            </p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-mf-muted">
              — {quoteSrc} —
            </p>
          </div>
        </Reveal>

        {/* ─── SECTION 3: COUPLE (stagger cards + hover tilt) ─── */}
        <section className="py-8 space-y-6">
          <Reveal>
            <h3 className="font-flow-display text-3xl font-bold text-center">
              <span className="flow-shimmer-text">Mempelai</span>
            </h3>
          </Reveal>

          {[
            {
              name: groom,
              parents: groomParents,
              photo: photos.groom,
              role: 'The Groom',
              tilt: -1.5,
            },
            {
              name: bride,
              parents: brideParents,
              photo: photos.bride,
              role: 'The Bride',
              tilt: 1.5,
            },
          ].map((person, idx) => (
            <Reveal key={person.role} delay={idx * 0.1}>
              <motion.div
                whileHover={{ scale: 1.02, rotate: person.tilt * -1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className={`bg-white/60 backdrop-blur border border-mf-rose/20 rounded-[1.75rem] p-6 shadow-xl flex gap-5 items-center ${
                  idx === 1 ? 'flex-row-reverse text-right' : ''
                }`}
              >
                <motion.div
                  className="relative shrink-0"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div
                    className="absolute -inset-2 rounded-full bg-gradient-to-br from-mf-rose to-mf-deep opacity-30 blur-sm"
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: idx }}
                  />
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover object-center ring-4 ring-mf-rose/40 shadow-lg"
                  />
                </motion.div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-mf-muted">
                    {person.role}
                  </p>
                  <h4 className="font-flow-display text-2xl sm:text-3xl font-bold mt-1">{person.name}</h4>
                  <p className="text-xs sm:text-sm text-mf-ink/70 mt-2">{person.parents}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </section>

        {/* ─── SECTION 4: COUNTDOWN FLIP ─── */}
        <Reveal className="py-8">
          <div className="bg-mf-deep text-mf-cream rounded-[1.75rem] p-7 shadow-2xl shadow-mf-deep/40 relative overflow-hidden">
            {/* Kilau berjalan di kartu countdown */}
            <motion.div
              className="absolute inset-0 opacity-10 pointer-events-none"
              animate={{ backgroundPositionX: ['0%', '200%'] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
              style={{
                backgroundImage:
                  'linear-gradient(115deg, transparent 45%, var(--color-mf-cream) 50%, transparent 55%)',
                backgroundSize: '200% 100%',
              }}
            />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-center flex items-center justify-center gap-2 mb-5">
              <Clock3 size={14} className="text-mf-rose" />
              Menuju Hari Bahagia
            </p>

            <div className="grid grid-cols-4 gap-3">
              {(
                [
                  ['Hari', timeLeft.days],
                  ['Jam', timeLeft.hours],
                  ['Menit', timeLeft.minutes],
                  ['Detik', timeLeft.seconds],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="text-center">
                  <div className="h-14 sm:h-16 flex items-center justify-center overflow-hidden rounded-xl bg-white/95 text-mf-deep border border-mf-rose/40 shadow-inner relative z-10">
                    {/* Angka flip: keluar ke atas saat berganti detik */}
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={value}
                        className="font-flow-display text-2xl sm:text-3xl font-black"
                        initial={{ y: '80%', opacity: 0, filter: 'blur(3px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ y: '-80%', opacity: 0, filter: 'blur(3px)' }}
                        transition={{ duration: 0.35, ease: EASE_OUT }}
                      >
                        {String(value).padStart(2, '0')}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="block mt-2 text-[10px] uppercase tracking-widest text-mf-cream/70">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ─── SECTION 5: WAKTU ACARA (stagger) ─── */}
        <Reveal className="py-8" delay={0.05}>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
          >
            {[
              { title: 'Akad Nikah', time: schedule.akadTime, date: formattedAkadDate },
              { title: 'Resepsi', time: schedule.resepsiTime, date: formattedResepsiDate },
            ].map((event) => (
              <motion.div
                key={event.title}
                variants={{
                  hidden: { opacity: 0, y: 36 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
                }}
                whileHover={{ y: -6 }}
                className="bg-white/60 backdrop-blur border border-mf-rose/20 rounded-[1.5rem] p-6 shadow-xl text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-mf-deep text-mf-cream flex items-center justify-center mb-4 shadow-lg">
                  {event.title === 'Akad Nikah' ? <Heart size={20} /> : <CalendarDays size={20} />}
                </div>
                <h4 className="font-flow-display text-xl font-bold">{event.title}</h4>
                <div className="mt-3 space-y-1 text-sm text-mf-ink/80">
                  <p className="font-semibold text-mf-deep">{event.date || formattedDate}</p>
                  <p className="inline-flex items-center justify-center gap-1.5">
                    <Clock3 size={13} className="text-mf-rose" />
                    {event.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Venue + tombol maps magnetik */}
          <Reveal className="mt-6">
            <div className="bg-white/60 backdrop-blur border border-mf-rose/20 rounded-[1.75rem] p-7 shadow-xl text-center space-y-4">
              <MapPin size={26} className="text-mf-rose mx-auto" />
              <div>
                <h4 className="font-flow-display text-xl sm:text-2xl font-bold">{venue.name}</h4>
                <p className="text-sm text-mf-ink/70 mt-1 max-w-sm mx-auto">{venue.address}</p>
              </div>
              <motion.a
                href={venue.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-mf-deep text-mf-cream font-semibold shadow-lg cursor-pointer"
              >
                <Navigation size={16} className="text-mf-rose" />
                Buka Google Maps
              </motion.a>
            </div>
          </Reveal>
        </Reveal>

        {/* ─── SECTION 6: GALERI (grid reveal + shared-element lightbox) ─── */}
        <Reveal className="py-8">
          <h3 className="font-flow-display text-3xl font-bold text-center mb-6">
            <span className="flow-shimmer-text">Galeri Momen</span>
          </h3>
          <div className="columns-2 sm:columns-3 gap-3 [column-fill:_balance]">
            {gallery.map((img, idx) => (
              <motion.button
                key={`${img}-${idx}`}
                layoutId={`gallery-img-${idx}`}
                onClick={() => setActiveImageIdx(idx)}
                whileHover={{ scale: 1.04, zIndex: 5 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: (idx % 3) * 0.1 }}
                className="mb-3 block w-full overflow-hidden rounded-2xl shadow-lg cursor-pointer relative group"
              >
                <img
                  src={img}
                  alt={`Momen ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-mf-deep/0 group-hover:bg-mf-deep/20 transition-colors duration-500" />
              </motion.button>
            ))}
          </div>

          {/* Lightbox dengan transisi shared-element (layoutId) */}
          <AnimatePresence>
            {activeImage && (
              <motion.div
                key="lightbox"
                className="fixed inset-0 z-50 bg-mf-deep/90 backdrop-blur-sm flex items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveImageIdx(null)}
              >
                <motion.img
                  key="lightbox-img"
                  layoutId={`gallery-img-${activeImageIdx}`}
                  src={activeImage}
                  alt="Momen diperbesar"
                  className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain z-10 relative"
                  transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                />
                <motion.button
                  className="absolute top-5 right-5 w-11 h-11 rounded-full bg-mf-cream text-mf-ink flex items-center justify-center cursor-pointer shadow-lg"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  aria-label="Tutup galeri"
                >
                  <X size={20} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </Reveal>

        {/* ─── SECTION 7: GIFT (kartu bank stagger + copy feedback motion) ─── */}
        {banks.length > 0 && (
          <Reveal className="py-8">
            <div className="text-center space-y-2">
              <Gift size={26} className="text-mf-rose mx-auto" />
              <h3 className="font-flow-display text-2xl sm:text-3xl font-bold">Amplop Digital</h3>
              <p className="text-sm text-mf-ink/70 max-w-md mx-auto">
                Doa restu Anda merupakan karunia terindah bagi kami. Namun jika ingin memberi tanda
                kasih, dapat melalui:
              </p>
            </div>

            <motion.div
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
            >
              {banks.map((bank, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
                  }}
                  whileHover={{ y: -5 }}
                  className="bg-white/60 backdrop-blur border border-mf-rose/25 rounded-[1.5rem] p-6 shadow-xl space-y-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-widest text-mf-deep">
                      {bank.bank}
                    </span>
                    <Gift size={16} className="text-mf-rose" />
                  </div>
                  <div>
                    <p className="font-mono text-lg font-bold tracking-wider">{bank.number}</p>
                    <p className="text-xs text-mf-ink/70">a.n. {bank.name}</p>
                  </div>
                  <motion.button
                    onClick={() => handleCopyRekening(bank.number, bank.bank, idx)}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-2.5 rounded-xl bg-mf-deep/10 hover:bg-mf-deep text-mf-ink hover:text-mf-cream border border-mf-deep/20 transition-colors duration-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copiedIndex === idx ? (
                        <motion.span
                          key="copied"
                          className="inline-flex items-center gap-1.5"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                        >
                          <Check size={14} />
                          Tersalin!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          className="inline-flex items-center gap-1.5"
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.6, opacity: 0 }}
                        >
                          <Copy size={14} />
                          Salin Nomor Rekening
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>
        )}

        {/* ─── SECTION 8: RSVP & WISHES WALL ─── */}
        <Reveal className="py-8">
          <div className="bg-white/65 backdrop-blur border border-mf-rose/25 rounded-[1.75rem] p-7 shadow-xl">
            <h3 className="font-flow-display text-2xl sm:text-3xl font-bold text-center flex items-center justify-center gap-2">
              <MessageCircle size={22} className="text-mf-rose" />
              Kirim Ucapan
            </h3>

            {rsvpSuccess ? (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-center py-10 space-y-3"
              >
                <motion.div
                  className="mx-auto w-16 h-16 rounded-full bg-mf-rose text-mf-cream flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.12, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <CheckCircle2 size={30} />
                </motion.div>
                <p className="font-bold text-lg">Terima kasih!</p>
                <p className="text-sm text-mf-ink/70 max-w-xs mx-auto">
                  Ucapan dan konfirmasi kehadiran Anda sudah kami terima.
                </p>
                <button
                  onClick={() => setRsvpSuccess(false)}
                  className="text-xs font-bold text-mf-deep underline underline-offset-4 cursor-pointer"
                >
                  Ubah jawaban
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSendRsvp} className="mt-5 space-y-4" noValidate={false}>
                {/* Status kehadiran */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-mf-muted mb-2 ml-1">
                    Konfirmasi Kehadiran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ['hadir', 'Hadir'],
                        ['tidak_hadir', 'Tidak Hadir'],
                        ['ragu', 'Ragu-ragu'],
                      ] as const
                    ).map(([value, label]) => (
                      <motion.button
                        key={value}
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setRsvpStatus(value)}
                        className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-colors duration-300 cursor-pointer ${
                          rsvpStatus === value
                            ? 'bg-mf-deep text-mf-cream border-mf-deep shadow-lg'
                            : 'bg-transparent text-mf-ink/70 border-mf-muted/40 hover:border-mf-rose'
                        }`}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Pax muncul dgn animasi hanya jika hadir */}
                <AnimatePresence>
                  {rsvpStatus === 'hadir' && (
                    <motion.div
                      key="pax"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-mf-muted mb-2 ml-1">
                        <Users size={12} /> Jumlah Hadir
                      </label>
                      <select
                        aria-label="Jumlah hadir"
                        value={rsvpPax}
                        onChange={(e) => setRsvpPax(Number(e.target.value))}
                        className="w-full p-3 rounded-xl bg-white text-mf-ink border border-mf-muted/40 outline-none focus:border-mf-rose cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} Orang
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Nama tamu */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-mf-muted mb-2 ml-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full p-3 rounded-xl bg-white text-mf-ink placeholder:text-mf-muted/60 border border-mf-muted/40 outline-none focus:border-mf-rose transition-colors"
                  />
                </div>

                {/* Ucapan */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-mf-muted mb-2 ml-1">
                    Ucapan & Doa
                  </label>
                  <textarea
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    placeholder="Tuliskan doa terbaik untuk kedua mempelai..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-white text-mf-ink placeholder:text-mf-muted/60 border border-mf-muted/40 outline-none focus:border-mf-rose transition-colors resize-none"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmittingRsvp || !rsvpName.trim()}
                  whileHover={isSubmittingRsvp ? {} : { scale: 1.03 }}
                  whileTap={isSubmittingRsvp ? {} : { scale: 0.95 }}
                  animate={isSubmittingRsvp ? { y: [0, -2, 2, 0] } : {}}
                  transition={
                    isSubmittingRsvp ? { duration: 0.5, repeat: Infinity } : undefined
                  }
                  className="w-full py-3.5 rounded-xl bg-mf-deep text-mf-cream font-bold shadow-lg disabled:opacity-60 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingRsvp ? 'Mengirim...' : (
                    <>
                      <Send size={16} className="text-mf-rose" />
                      Kirim Ucapan
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* WISHES WALL — daftar ucapan dengan animasi layout + stagger */}
            {wishesList.length > 0 && (
              <div className="mt-7 pt-6 border-t border-mf-rose/20 space-y-3 max-h-96 overflow-y-auto pr-1 chat-scroll">
                <p className="text-xs font-bold uppercase tracking-widest text-mf-muted mb-1">
                  {wishesList.length} Ucapan Masuk
                </p>
                <AnimatePresence initial={false}>
                  {wishesList.map((wish) => (
                    <motion.div
                      key={wish.id}
                      layout
                      initial={{ opacity: 0, y: -18, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                      className="bg-white/80 rounded-2xl p-4 border border-mf-muted/20 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm">{wish.guest_name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            wish.status === 'hadir'
                              ? 'bg-mf-rose/15 text-mf-deep'
                              : 'bg-mf-muted/15 text-mf-muted'
                          }`}
                        >
                          {wish.status === 'hadir'
                            ? `Hadir · ${wish.pax}`
                            : wish.status === 'ragu'
                              ? 'Ragu'
                              : 'Tidak Hadir'}
                        </span>
                      </div>
                      <p className="text-sm text-mf-ink/80 leading-relaxed">{wish.message}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </Reveal>

        {/* ─── SECTION 9: CLOSING ─── */}
        <Reveal className="pt-10 pb-6 text-center border-t border-mf-rose/25">
          <p className="text-sm italic text-mf-ink/75 max-w-sm mx-auto leading-relaxed">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i
            berkenan hadir untuk memberikan doa restu.
          </p>

          <div className="mt-14 space-y-1 relative">
            <motion.div
              className="mx-auto mb-4 w-9 h-9 rounded-full bg-mf-rose text-mf-cream flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.25, 1], rotate: [0, 12, -12, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart size={16} fill="currentColor" strokeWidth={0} />
            </motion.div>

            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-mf-muted">
              Wassalamualaikum Warahmatullahi Wabarakatuh
            </p>
            <h4 className="font-flow-display text-3xl sm:text-4xl font-black flow-shimmer-text mt-3">
              {groom} &amp; {bride}
            </h4>
            <p className="text-xs text-mf-ink/60">Beserta Keluarga Besar</p>
          </div>

          <div className="pt-12 text-[11px] text-mf-muted tracking-wider">
            Motion Flow Theme • LoVerse Digital Invitation
          </div>
        </Reveal>
      </main>
    </div>
  );
}
















