// ============================================================
// src/templates/themes/EmeraldRoyaleTheme.tsx
// ------------------------------------------------------------
// Tema Undangan: Emerald Royale (Kategori: RSVP)
// Konsep       : Kemewahan Kerajaan Modern (Deep Emerald & Champagne Gold)
// Dipakai di   : templates/Registry.ts
// Keterikatan  : types/template, utils/templateHelpers, hooks/*
// ============================================================

import { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Gift,
  CheckCircle2,
  Copy,
  Music,
  Play,
  Pause,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
  Send,
  MessageCircle,
  Users,
  Check,
  Crown,
} from 'lucide-react';
import type { TemplateProps, RsvpPayload } from '../../types/template';
import type { RsvpRow, RsvpStatus } from '../../types/database';
import { useCountdown } from '../../hooks/useCountdown';
import {
  formatDate,
  resolveBanks,
  resolveGallery,
  resolvePhotos,
  resolveVenue,
  resolveSchedule,
} from '../../utils/templateHelpers';
import { useOpenInvitation } from '../shared/useOpenInvitation';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export default function EmeraldRoyaleTheme({
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

  // Amplop & Pemutar Audio (Sinkronisasi status otomatis)
  const { isOpen, open, playing: isPlaying, toggle: toggleAudio } = useOpenInvitation(audioRef, 0);

  // Data resolusi dengan fallback cerdas
  const photos = resolvePhotos(data);
  const gallery = resolveGallery(data);
  const banks = resolveBanks(data);
  const venue = resolveVenue(data);
  const schedule = resolveSchedule(data, date);

  const quote =
    data?.quote ||
    'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.';
  const quoteSrc = data?.quote_src || 'QS. Ar-Rum: 21';
  const audioUrl = data?.audio_url || 'https://r2.loverse.id/defaults/audio/ee2e74c72c.mp3';

  const groomParents = data?.groom_parents || 'Bpk. Capulet & Ibu Capulet';
  const brideParents = data?.bride_parents || 'Bpk. Montague & Ibu Montague';

  // Format Tanggal Acara
  const formattedDate = formatDate(date, 'id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedAkadDate = schedule.akadDate
    ? formatDate(schedule.akadDate, 'id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : formattedDate;
  const formattedResepsiDate = schedule.resepsiDate
    ? formatDate(schedule.resepsiDate, 'id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : formattedDate;

  // Countdown
  const akadClock = (schedule.akadTime || '08:00').split(' ')[0].substring(0, 5);
  const timeLeft = useCountdown(date, akadClock);

  // Status Modal Lightbox Galeri
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Status Copy Feedback
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Status Form RSVP
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(submittedData?.status || 'hadir');
  const [rsvpPax, setRsvpPax] = useState<number>(submittedData?.pax || 1);
  const [rsvpName, setRsvpName] = useState<string>(submittedData?.guest_name || guestName || '');
  const [rsvpMessage, setRsvpMessage] = useState<string>(submittedData?.message || '');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(Boolean(submittedData));

  // Daftar ucapan doa (RSVP Wishes Wall)
  const [wishesList, setWishesList] = useState<RsvpRow[]>(() => data?.rsvps || []);

  const handleCopyRekening = (number: string, bankName: string, idx: number) => {
    copyToClipboard(number, `Nomor Rekening ${bankName}`);
    setCopiedIndex(idx);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
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
      if (onRsvpSubmit) {
        await onRsvpSubmit(payload);
      }

      // Optimistic update ucapan
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
          reply: undefined,
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
    <div className="min-h-screen bg-[#04231C] text-[#FAF8F2] font-sans relative overflow-x-hidden selection:bg-[#D4AF37] selection:text-[#04231C]">
      {/* Import Font Google: Cinzel & Cormorant Garamond & Plus Jakarta Sans */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        .font-royal-title { font-family: 'Cinzel', serif; }
        .font-royal-serif { font-family: 'Cormorant Garamond', serif; }
        .font-royal-sans { font-family: 'Plus Jakarta Sans', sans-serif; }

        @keyframes shimmer-gold {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gold-shimmer-text {
          background: linear-gradient(90deg, #D4AF37 0%, #FFF3C4 50%, #D4AF37 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-gold 4s infinite linear;
        }

        .gold-border-gradient {
          border-image: linear-gradient(135deg, #D4AF37, #F3E5AB, #996515, #D4AF37) 1;
        }

        .royal-arch {
          border-top-left-radius: 9999px;
          border-top-right-radius: 9999px;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>

      {/* Audio Elemen Tersembunyi */}
      <audio ref={audioRef} src={audioUrl} loop preload="none" />

      {/* ============================================================ */}
      {/* 1. COVER / ENVELOPE OVERLAY */}
      {/* ============================================================ */}
      <div
        className={`fixed inset-0 z-50 bg-[#04231C] text-[#FAF8F2] flex flex-col justify-between items-center px-4 py-8 sm:py-12 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Background Ambient Glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#0E4D3E]/40 rounded-full blur-3xl" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#0E4D3E]/40 rounded-full blur-3xl" />
        </div>

        {/* Ornamen Sudut Emas */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#D4AF37]/40 pointer-events-none" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#D4AF37]/40 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#D4AF37]/40 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#D4AF37]/40 pointer-events-none" />

        {/* Top: Header Acara */}
        <div className="relative text-center z-10 pt-4 space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#D4AF37]/30 bg-[#093B2F]/60 backdrop-blur-xs text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
            <Crown size={13} className="text-[#D4AF37]" />
            The Wedding Celebration
          </div>
          <p className="font-royal-serif text-sm sm:text-base italic text-[#F3E5AB]/80">
            Undangan Pernikahan
          </p>
        </div>

        {/* Middle: Portrait Arch + Nama Mempelai */}
        <div className="relative text-center z-10 my-auto flex flex-col items-center max-w-md w-full px-4">
          <div className="relative w-44 h-56 sm:w-52 sm:h-64 royal-arch overflow-hidden p-1 bg-gradient-to-b from-[#D4AF37] via-[#F3E5AB]/60 to-[#04231C] shadow-2xl shadow-[#D4AF37]/10 mb-6">
            <div className="w-full h-full royal-arch overflow-hidden bg-[#093B2F]">
              <img
                src={photos.cover}
                alt="Couple Cover"
                width={1200}
                height={900}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          <h1 className="font-royal-title text-3xl sm:text-4xl md:text-5xl font-extrabold gold-shimmer-text tracking-wider uppercase leading-tight">
            {groom}
            <span className="block font-royal-serif italic text-2xl sm:text-3xl my-1 text-[#F3E5AB] font-normal lowercase">
              &
            </span>
            {bride}
          </h1>

          <p className="mt-3 font-royal-sans text-xs sm:text-sm text-[#FAF8F2]/75 tracking-widest uppercase">
            {formattedDate}
          </p>
        </div>

        {/* Bottom: Kartu Tamu & Tombol Buka Amplop */}
        <div className="relative text-center z-10 w-full max-w-sm pb-4 space-y-4">
          <div className="bg-[#093B2F]/80 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-4 shadow-xl">
            <p className="text-[11px] text-[#F3E5AB]/70 tracking-widest uppercase">
              Kepada Yth. Bapak/Ibu/Saudara/i:
            </p>
            <p className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {guestName || 'Tamu Undangan'}
            </p>
          </div>

          <button
            onClick={open}
            className="group relative w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#996515] text-[#04231C] font-royal-sans font-bold text-sm tracking-wider uppercase shadow-lg shadow-[#D4AF37]/25 hover:shadow-xl hover:shadow-[#D4AF37]/40 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#04231C] group-hover:rotate-12 transition-transform" />
            <span>Buka Undangan</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FLOATING AUDIO PLAYER BUTTON */}
      {/* ============================================================ */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={toggleAudio}
          title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
          className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#E5C158] to-[#996515] p-[2px] shadow-xl shadow-[#04231C]/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
        >
          <div className="w-full h-full rounded-full bg-[#04231C] flex items-center justify-center text-[#D4AF37] relative overflow-hidden">
            {isPlaying ? (
              <div className="flex items-center justify-center animate-spin-slow">
                <Music size={18} className="text-[#D4AF37]" />
              </div>
            ) : (
              <Play size={18} className="text-[#D4AF37] translate-x-0.5" />
            )}
            {/* Equalizer mini pulse dot */}
            {isPlaying && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
        </button>
      </div>

      {/* ============================================================ */}
      {/* MAIN INVITATION CONTENT */}
      {/* ============================================================ */}
      <main className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-20 sm:space-y-28">
        {/* Ornamen Latar Garis Samping */}
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-3xl border-x border-[#D4AF37]/10 pointer-events-none" />

        {/* ------------------------------------------------------------ */}
        {/* SECTION 1: HERO & TITLE */}
        {/* ------------------------------------------------------------ */}
        <section className="text-center pt-8 sm:pt-14 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#093B2F]/60 backdrop-blur-xs text-xs font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
            <Crown size={14} className="text-[#D4AF37]" />
            Walimatul 'Urs
          </div>

          <div className="space-y-2">
            <p className="font-royal-serif text-lg sm:text-xl italic text-[#F3E5AB]">
              The Wedding Of
            </p>
            <h2 className="font-royal-title text-4xl sm:text-5xl md:text-6xl font-black gold-shimmer-text tracking-wider uppercase leading-tight">
              {groom} <span className="font-royal-serif italic font-light text-3xl sm:text-4xl text-[#F3E5AB]">&</span> {bride}
            </h2>
            <p className="font-royal-sans text-xs sm:text-sm text-[#FAF8F2]/80 tracking-[0.2em] uppercase pt-2">
              {formattedDate}
            </p>
          </div>

          {/* Hero Banner Image */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] royal-arch overflow-hidden p-1.5 bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/40 to-transparent shadow-2xl shadow-[#D4AF37]/10 my-8">
            <div className="w-full h-full royal-arch overflow-hidden bg-[#093B2F]">
              <img
                src={photos.cover}
                alt="Couple Hero"
                width={1200}
                height={900}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover object-center brightness-95 hover:scale-105 transition-transform duration-1000"
              />
            </div>
          </div>

          {/* COUNTDOWN TIMER */}
          <div className="bg-[#093B2F]/70 border border-[#D4AF37]/30 backdrop-blur-md rounded-3xl p-6 shadow-xl max-w-lg mx-auto">
            <p className="text-xs font-bold text-[#F3E5AB] uppercase tracking-[0.25em] mb-4 flex items-center justify-center gap-2">
              <Clock size={14} className="text-[#D4AF37]" />
              Hitung Mundur Acara
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-[#04231C]/80 border border-[#D4AF37]/25 rounded-2xl p-2.5 sm:p-3.5 text-center">
                <span className="block font-royal-title text-2xl sm:text-3xl font-black text-[#F3E5AB]">
                  {timeLeft.days}
                </span>
                <span className="text-[10px] sm:text-xs text-[#FAF8F2]/70 uppercase tracking-wider">
                  Hari
                </span>
              </div>
              <div className="bg-[#04231C]/80 border border-[#D4AF37]/25 rounded-2xl p-2.5 sm:p-3.5 text-center">
                <span className="block font-royal-title text-2xl sm:text-3xl font-black text-[#F3E5AB]">
                  {timeLeft.hours}
                </span>
                <span className="text-[10px] sm:text-xs text-[#FAF8F2]/70 uppercase tracking-wider">
                  Jam
                </span>
              </div>
              <div className="bg-[#04231C]/80 border border-[#D4AF37]/25 rounded-2xl p-2.5 sm:p-3.5 text-center">
                <span className="block font-royal-title text-2xl sm:text-3xl font-black text-[#F3E5AB]">
                  {timeLeft.minutes}
                </span>
                <span className="text-[10px] sm:text-xs text-[#FAF8F2]/70 uppercase tracking-wider">
                  Menit
                </span>
              </div>
              <div className="bg-[#04231C]/80 border border-[#D4AF37]/25 rounded-2xl p-2.5 sm:p-3.5 text-center">
                <span className="block font-royal-title text-2xl sm:text-3xl font-black text-[#F3E5AB]">
                  {timeLeft.seconds}
                </span>
                <span className="text-[10px] sm:text-xs text-[#FAF8F2]/70 uppercase tracking-wider">
                  Detik
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* SECTION 2: QUOTE */}
        {/* ------------------------------------------------------------ */}
        <section className="relative text-center py-10 px-6 sm:px-10 rounded-3xl bg-gradient-to-b from-[#093B2F]/90 to-[#04231C] border border-[#D4AF37]/30 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <Heart className="w-8 h-8 mx-auto text-[#D4AF37] mb-4 opacity-80" />
          <p className="font-royal-serif text-base sm:text-xl italic leading-relaxed text-[#FAF8F2]/90 max-w-xl mx-auto">
            "{quote}"
          </p>
          <p className="mt-4 font-royal-title text-xs sm:text-sm font-bold text-[#D4AF37] tracking-widest uppercase">
            — {quoteSrc}
          </p>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* SECTION 3: COUPLE PROFILES */}
        {/* ------------------------------------------------------------ */}
        <section className="space-y-10 text-center">
          <div className="space-y-2">
            <h3 className="font-royal-title text-2xl sm:text-3xl font-bold text-[#F3E5AB] tracking-widest uppercase">
              Pasangan Mempelai
            </h3>
            <p className="font-royal-serif text-sm sm:text-base italic text-[#FAF8F2]/70">
              Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud melangsungkan pernikahan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            {/* MEMPELAI PRIA */}
            <div className="bg-[#093B2F]/60 border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg hover:border-[#D4AF37]/60 transition duration-300">
              <div className="relative w-40 h-52 sm:w-48 sm:h-60 royal-arch overflow-hidden p-1 bg-gradient-to-b from-[#D4AF37] to-transparent shadow-md mb-6">
                <div className="w-full h-full royal-arch overflow-hidden bg-[#04231C]">
                  <img
                    src={photos.groom}
                    alt={groom}
                    width={320}
                    height={416}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                  />
                </div>
              </div>

              <h4 className="font-royal-title text-2xl font-bold text-[#F3E5AB]">{groom}</h4>
              <p className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase mt-1">
                Mempelai Pria
              </p>
              <div className="mt-3 text-xs text-[#FAF8F2]/75 space-y-0.5">
                <p>Putra tercinta dari:</p>
                <p className="font-semibold text-[#FAF8F2]">{groomParents}</p>
              </div>
            </div>

            {/* MEMPELAI WANITA */}
            <div className="bg-[#093B2F]/60 border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-lg hover:border-[#D4AF37]/60 transition duration-300">
              <div className="relative w-40 h-52 sm:w-48 sm:h-60 royal-arch overflow-hidden p-1 bg-gradient-to-b from-[#D4AF37] to-transparent shadow-md mb-6">
                <div className="w-full h-full royal-arch overflow-hidden bg-[#04231C]">
                  <img
                    src={photos.bride}
                    alt={bride}
                    width={320}
                    height={416}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top hover:scale-105 transition duration-500"
                  />
                </div>
              </div>

              <h4 className="font-royal-title text-2xl font-bold text-[#F3E5AB]">{bride}</h4>
              <p className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase mt-1">
                Mempelai Wanita
              </p>
              <div className="mt-3 text-xs text-[#FAF8F2]/75 space-y-0.5">
                <p>Putri tercinta dari:</p>
                <p className="font-semibold text-[#FAF8F2]">{brideParents}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* SECTION 4: EVENT SCHEDULE (AKAD & RESEPSI) */}
        {/* ------------------------------------------------------------ */}
        <section className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="font-royal-title text-2xl sm:text-3xl font-bold text-[#F3E5AB] tracking-widest uppercase">
              Rangkaian Acara
            </h3>
            <p className="font-royal-serif text-sm sm:text-base italic text-[#FAF8F2]/70">
              Waktu dan tempat pelaksanaan akad nikah & resepsi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AKAD NIKAH */}
            <div className="bg-gradient-to-b from-[#093B2F] to-[#04231C] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl relative overflow-hidden text-left">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB] text-xs font-bold uppercase tracking-wider">
                  Akad Nikah
                </span>
                <Crown size={16} className="text-[#D4AF37]" />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 text-sm">
                  <Calendar size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <span className="font-semibold">{formattedAkadDate}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Clock size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>{schedule.akadTime}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#F3E5AB]">{venue.name}</p>
                    <p className="text-xs text-[#FAF8F2]/75 mt-0.5">{venue.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RESEPSI */}
            <div className="bg-gradient-to-b from-[#093B2F] to-[#04231C] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl relative overflow-hidden text-left">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB] text-xs font-bold uppercase tracking-wider">
                  Resepsi Pernikahan
                </span>
                <Sparkles size={16} className="text-[#D4AF37]" />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 text-sm">
                  <Calendar size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <span className="font-semibold">{formattedResepsiDate}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Clock size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>{schedule.resepsiTime}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#F3E5AB]">{venue.name}</p>
                    <p className="text-xs text-[#FAF8F2]/75 mt-0.5">{venue.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOMBOL GOOGLE MAPS */}
          {venue.mapsLink && venue.mapsLink !== '#' && (
            <div className="pt-2">
              <a
                href={venue.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#996515] text-[#04231C] font-bold text-sm tracking-wider uppercase shadow-lg shadow-[#D4AF37]/20 hover:shadow-xl hover:shadow-[#D4AF37]/35 active:scale-[0.98] transition duration-200"
              >
                <MapPin size={16} />
                <span>Petunjuk Arah Google Maps</span>
                <ExternalLink size={14} className="opacity-80" />
              </a>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------ */}
        {/* SECTION 5: GALLERY */}
        {/* ------------------------------------------------------------ */}
        {gallery.length > 0 && (
          <section className="space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="font-royal-title text-2xl sm:text-3xl font-bold text-[#F3E5AB] tracking-widest uppercase">
                Galeri Momen Bahagia
              </h3>
              <p className="font-royal-serif text-sm sm:text-base italic text-[#FAF8F2]/70">
                Untaian kisah kasih dalam potret kebersamaan kami
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {gallery.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border border-[#D4AF37]/30 bg-[#093B2F] shadow-md hover:border-[#D4AF37] transition duration-300"
                >
                  <img
                    src={imgUrl}
                    alt={`Gallery ${idx + 1}`}
                    width={600}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04231C]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                    <span className="text-[11px] font-semibold text-[#F3E5AB] flex items-center gap-1">
                      <Sparkles size={12} /> Lihat Foto
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LIGHTBOX MODAL */}
        {activeImage && (
          <div
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
            <img
              src={activeImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-[#D4AF37]/50 shadow-2xl"
            />
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* SECTION 6: RSVP & BUKU TAMU */}
        {/* ------------------------------------------------------------ */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h3 className="font-royal-title text-2xl sm:text-3xl font-bold text-[#F3E5AB] tracking-widest uppercase">
              Konfirmasi Kehadiran & Doa
            </h3>
            <p className="font-royal-serif text-sm sm:text-base italic text-[#FAF8F2]/70">
              Merupakan suatu kehormatan & kebahagiaan bagi kami atas kehadiran Anda
            </p>
          </div>

          <div className="bg-[#093B2F]/80 border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
            <form onSubmit={handleSendRsvp} className="space-y-4">
              <div>
                <label htmlFor="demo-rsvp-name" className="block text-xs font-semibold text-[#F3E5AB] uppercase tracking-wider mb-1.5">
                  Nama Anda
                </label>
                <input
                  id="demo-rsvp-name"
                  type="text"
                  required
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Ketik nama Anda..."
                  className="w-full px-4 py-3 rounded-xl bg-[#04231C]/90 border border-[#D4AF37]/30 text-white placeholder-stone-400 focus:outline-none focus:border-[#D4AF37] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="demo-rsvp-status" className="block text-xs font-semibold text-[#F3E5AB] uppercase tracking-wider mb-1.5">
                    Konfirmasi Kehadiran
                  </label>
                  <select
                    id="demo-rsvp-status"
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                    className="w-full px-4 py-3 rounded-xl bg-[#04231C]/90 border border-[#D4AF37]/30 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                  >
                    <option value="hadir">Hadir</option>
                    <option value="tidak_hadir">Tidak Hadir</option>
                    <option value="ragu">Masih Ragu</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="demo-rsvp-pax" className="block text-xs font-semibold text-[#F3E5AB] uppercase tracking-wider mb-1.5">
                    Jumlah Tamu (Pax)
                  </label>
                  <input
                    id="demo-rsvp-pax"
                    type="number"
                    min={1}
                    max={10}
                    value={rsvpPax}
                    onChange={(e) => setRsvpPax(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-xl bg-[#04231C]/90 border border-[#D4AF37]/30 text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="demo-rsvp-message" className="block text-xs font-semibold text-[#F3E5AB] uppercase tracking-wider mb-1.5">
                  Ucapan & Doa Restu
                </label>
                <textarea
                  id="demo-rsvp-message"
                  rows={3}
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                  placeholder="Tuliskan ucapan selamat & doa untuk kedua mempelai..."
                  className="w-full px-4 py-3 rounded-xl bg-[#04231C]/90 border border-[#D4AF37]/30 text-white placeholder-stone-400 focus:outline-none focus:border-[#D4AF37] text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRsvp}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#996515] text-[#04231C] font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-[#D4AF37]/30 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRsvp ? (
                  <span>Mengirim...</span>
                ) : (
                  <>
                    <Send size={15} />
                    <span>{rsvpSuccess ? 'Kirim Ulang Konfirmasi' : 'Kirim Konfirmasi & Doa'}</span>
                  </>
                )}
              </button>

              {rsvpSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Terima kasih! Konfirmasi dan doa Anda telah berhasil tercatat.</span>
                </div>
              )}
            </form>

            {/* DINDING UCAPAN (WISHES WALL) */}
            <div className="pt-4 border-t border-[#D4AF37]/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#F3E5AB]">
                <span className="flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-[#D4AF37]" />
                  Daftar Ucapan Doa ({wishesList.length})
                </span>
                <span className="text-[11px] text-[#FAF8F2]/60">Terbaru</span>
              </div>

              <div className="max-h-64 overflow-y-auto pr-1 space-y-2.5">
                {wishesList.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-4 italic">
                    Belum ada ucapan. Jadilah yang pertama memberikan doa restu!
                  </p>
                ) : (
                  wishesList.map((wish, idx) => (
                    <div
                      key={wish.id || idx}
                      className="bg-[#04231C]/75 border border-[#D4AF37]/20 rounded-2xl p-3.5 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#F3E5AB] truncate">
                          {wish.guest_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            wish.status === 'hadir'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : wish.status === 'tidak_hadir'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {wish.status === 'hadir'
                            ? 'Hadir'
                            : wish.status === 'tidak_hadir'
                              ? 'Tidak Hadir'
                              : 'Ragu'}
                        </span>
                      </div>
                      <p className="text-[#FAF8F2]/85 leading-relaxed whitespace-pre-wrap">
                        {wish.message}
                      </p>
                      {wish.reply && (
                        <div className="mt-2 p-2 rounded-xl bg-[#093B2F] border-l-2 border-[#D4AF37] text-[11px] text-[#F3E5AB]">
                          <span className="font-bold block">Balasan Mempelai:</span>
                          <span>{wish.reply}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* SECTION 7: WEDDING GIFT / KADO DIGITAL */}
        {/* ------------------------------------------------------------ */}
        {banks.length > 0 && (
          <section className="space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="font-royal-title text-2xl sm:text-3xl font-bold text-[#F3E5AB] tracking-widest uppercase">
                Tanda Kasih (Kado Digital)
              </h3>
              <p className="font-royal-serif text-sm sm:text-base italic text-[#FAF8F2]/70 max-w-md mx-auto">
                Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda bermaksud memberi tanda kasih, dapat melalui:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              {banks.map((bank, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-[#093B2F] to-[#04231C] border border-[#D4AF37]/35 rounded-3xl p-5 shadow-xl space-y-3 text-left relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-royal-title font-bold text-sm text-[#F3E5AB] uppercase">
                      {bank.bank}
                    </span>
                    <Gift size={16} className="text-[#D4AF37]" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] text-[#FAF8F2]/60 uppercase tracking-wider">
                      Nomor Rekening
                    </p>
                    <p className="font-mono text-base font-bold text-white tracking-wider">
                      {bank.number}
                    </p>
                    <p className="text-xs text-[#FAF8F2]/80">a.n. {bank.name}</p>
                  </div>

                  <button
                    onClick={() => handleCopyRekening(bank.number, bank.bank, idx)}
                    className="w-full py-2 px-3 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37] hover:text-[#04231C] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={14} className="text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Salin Nomor Rekening</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------ */}
        {/* SECTION 8: CLOSING & FOOTER */}
        {/* ------------------------------------------------------------ */}
        <section className="text-center pt-8 pb-12 space-y-6 border-t border-[#D4AF37]/20">
          <p className="font-royal-serif text-base sm:text-lg italic text-[#FAF8F2]/80 max-w-md mx-auto">
            Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i sekalian, kami mengucapkan terima kasih yang sebesar-besarnya.
          </p>

          <div className="space-y-1">
            <p className="text-xs text-[#D4AF37] uppercase tracking-[0.25em]">Kami yang berbahagia,</p>
            <h4 className="font-royal-title text-3xl sm:text-4xl font-extrabold gold-shimmer-text uppercase">
              {groom} & {bride}
            </h4>
            <p className="text-xs text-[#FAF8F2]/60 pt-1">Beserta Keluarga Besar</p>
          </div>

          <div className="pt-8 text-[11px] text-[#FAF8F2]/40 tracking-wider">
            Emerald Royale Theme • LoVerse Digital Invitation
          </div>
        </section>
      </main>
    </div>
  );
}
