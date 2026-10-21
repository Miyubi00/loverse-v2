// ============================================================
// src/components/contact/AiAssistant.tsx
// ------------------------------------------------------------
// Kartu AI assistant di halaman /contact: messenger-style chat
// dengan avatar per pesan, animasi masuk, chip pertanyaan cepat,
// handover ke admin via Telegram (single-admin, busy indicator),
// serta eskalasi ke admin WhatsApp saat AI sibuk/limit/gagal.
// Dipakai di  : pages/ContactPage
// Keterikatan : hooks/useAiChat, i18n, lucide-react, react-icons
// ============================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bot, Headset, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from '../../i18n';
import { useAiChat } from '../../hooks/useAiChat';

interface AiAssistantProps {
  /** Nomor WA tujuan eskalasi (format 62xxx). */
  waNumber: string;
}

const SUGGESTION_KEYS = [
  'contact.ai.suggestionPrice',
  'contact.ai.suggestionHow',
  'contact.ai.suggestionPayment',
  'contact.ai.suggestionDiff',
] as const;

// ------------------------------------------------------------
// Render teks pesan dengan tautan yang bisa diklik:
//  - [label](url)                     -> teks "label" jadi tautan biru bergaris bawah.
//     TOLERAN: kurung tutup ')' boleh hilang atau ada tanda baca sebelum ')';
//     url tetap dikenali sampai spasi / ')' berikutnya.
//  - https://… & wa.me/…              -> tautan; URL milik loverse.id/situs ini
//                                        dipakai Link SPA (pindah halaman tanpa reload)
//  - /demo/<slug> & /wedding/<slug>   -> Link react-router (tanpa reload)
// Semua tautan tampil biru & bergaris bawah agar terlihat bisa diklik.
// ------------------------------------------------------------
const MESSAGE_LINK_RE =
  /\[([^\]\n]+)\]\(([^)\s]+)|https?:\/\/[^\s<>"']+|\/(?:demo|wedding)\/[a-z0-9_-]+|\bwa\.me\/[0-9]+/;

function messageLink(href: string, label: string, key: number) {
  const cleanHref = href.replace(/[.,;:!?…)\]]+$/, '');
  const linkClass =
    'font-medium text-ember-700 underline underline-offset-2 hover:text-ink-900 hover:bg-peach-100 rounded-sm break-all transition-colors cursor-pointer';
  let internalTo: string | null = null;
  if (cleanHref.startsWith('/')) {
    internalTo = cleanHref;
  } else {
    try {
      const url = new URL(cleanHref);
      if (url.hostname === window.location.hostname || url.hostname === 'loverse.id') {
        internalTo = url.pathname + url.search + url.hash;
      }
    } catch {
      /* bukan URL absolut — dibuka di tab baru */
    }
  }
  if (internalTo !== null) {
    return (
      <Link key={key} to={internalTo} className={linkClass}>
        {label}
      </Link>
    );
  }
  return (
    <a
      key={key}
      href={cleanHref.startsWith('http') ? cleanHref : `https://${cleanHref}`}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {label}
    </a>
  );
}

function MessageText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(MESSAGE_LINK_RE.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<span key={nodes.length}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      nodes.push(messageLink(match[2], match[1], nodes.length));
      // Kurung tutup ')' markdown tidak ikut regex karena [^)\s]+ berhenti di ')';
      // konsumsi agar ')' tidak ter-render sebagai teks. (Kasus ')' hilang: tidak ada yang dikonsumsi.)
      lastIndex = match.index + match[0].length;
      if (text[lastIndex] === ')') lastIndex++;
    } else {
      nodes.push(messageLink(match[0], match[0], nodes.length));
      lastIndex = match.index + match[0].length;
    }
  }
  if (lastIndex < text.length) {
    nodes.push(<span key={nodes.length}>{text.slice(lastIndex)}</span>);
  }
  return <>{nodes}</>;
}

export default function AiAssistant({ waNumber }: AiAssistantProps) {
  const { t } = useTranslation();
  const { messages, isTyping, isAdminTyping, send, retry, handoverActive, closeHandover, requestHandover } = useAiChat();

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, handoverActive]);

  const canSend = draft.trim().length > 0 && !isTyping;

  const handleSend = () => {
    if (!canSend) return;
    send(draft);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleEscalate = () => {
    const text =
      'Halo Admin, tadi asisten AI sedang sibuk. Saya mau bertanya tentang undangan digital...';
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section className="relative rounded-3xl bg-white border border-cream-300 shadow-lg shadow-ink-900/5 overflow-hidden flex flex-col">
      {/* --- HEADER --- */}
      <div className="relative bg-gradient-to-r from-ink-900 via-ink-800 to-ink-950 px-5 py-4 sm:px-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full border border-white/10" />
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-ember-600/20 rounded-full blur-2xl" />
        </div>

        <div className="relative flex items-center gap-3.5">
          <div className="relative shrink-0 rounded-full p-[2.5px] bg-gradient-to-br from-ember-600 via-peach-300 to-ember-600 shadow-md">
            <div className="rounded-full bg-ink-950 p-2.5">
              {handoverActive ? <Headset className="w-5 h-5 sm:w-6 sm:h-6 text-cream-100" /> : <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-peach-300" />}
            </div>
            <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-ink-950 ${handoverActive ? 'bg-success-600' : 'bg-success-600'}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {handoverActive ? 'Admin LoVerse' : t('contact.ai.title')}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold leading-none border ${handoverActive ? 'bg-success-600/20 border-success-600/40 text-cream-100' : 'bg-success-600/20 border-success-600/30 text-cream-100'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${handoverActive ? 'bg-success-600 animate-pulse' : 'bg-success-600 animate-pulse'}`} />
                {handoverActive ? 'Terhubung ke admin' : t('contact.ai.onlineChip')}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] sm:text-xs text-peach-300/85 truncate">
              {handoverActive ? 'Balasan admin akan muncul di sini • Ketik "selesai" untuk akhiri' : t('contact.ai.subtitle')}
            </p>
          </div>
          {handoverActive && (
            <button
              onClick={closeHandover}
              className="shrink-0 inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 px-2.5 py-1.5 rounded-full text-xs font-semibold transition"
            >
              <X size={12} /> Akhiri
            </button>
          )}
        </div>
      </div>

      {/* Handover banner */}
      {handoverActive && (
        <div className="bg-success-600/10 border-b border-success-600/20 px-4 py-2 flex items-center gap-2 text-xs text-success-700">
          <MessageCircle size={14} className="text-success-700 shrink-0" />
          <span className="font-semibold">Terhubung ke admin</span>
        </div>
      )}

      {/* --- AREA PESAN --- */}
      <div
        ref={scrollRef}
        className="chat-scroll h-[320px] sm:h-[380px] lg:h-[420px] max-h-[55dvh] overflow-y-auto bg-cream-100 px-3.5 sm:px-5 py-4 sm:py-5 space-y-4"
      >
        {messages.length === 0 && !isTyping && (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-2 text-center animate-msg-in">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-ember-600/25 blur-lg" aria-hidden="true" />
              <div className="relative p-4 rounded-full bg-white border border-cream-300 shadow-sm">
                <Bot className="w-8 h-8 text-ember-700" />
              </div>
            </div>
            <p className="text-sm text-ink-600 max-w-xs leading-relaxed">
              {t('contact.ai.greeting')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm pt-1">
              {SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => send(t(key))}
                  disabled={isTyping}
                  className="group flex items-center gap-2 bg-white border border-cream-300 text-xs font-semibold text-ink-800 rounded-full pl-3 pr-3.5 py-2.5 text-left shadow-xs hover:border-ember-600/50 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-ember-600" />
                  <span className="truncate">{t(key)}</span>
                </button>
              ))}
            </div>
            <button
              onClick={requestHandover}
              disabled={isTyping}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-900 bg-white border border-cream-300 px-3.5 py-2 rounded-full hover:bg-cream-100 transition disabled:opacity-50"
            >
              <Headset size={14} className="text-success-700" /> Hubungkan ke admin
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex justify-end animate-msg-in">
                <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-br from-ink-800 to-ink-950 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm shadow-sm shadow-ink-900/20 whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.kind === 'busy') {
            return (
              <div key={idx} className="flex justify-start animate-msg-in">
                <div className="w-[92%] sm:w-[85%] bg-gold-500/10 border border-gold-500/30 rounded-2xl rounded-tl-md p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-gold-500/15 text-gold-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <p className="font-bold text-xs text-gold-600">{t('contact.ai.busyTitle')}</p>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">{t('contact.ai.busyDesc')}</p>
                  <button
                    onClick={handleEscalate}
                    className="w-full py-2.5 bg-whatsapp-600 hover:bg-whatsapp-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-sm"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    {t('contact.ai.chatAdmin')}
                  </button>
                </div>
              </div>
            );
          }

          if (msg.kind === 'handover_busy') {
            return (
              <div key={idx} className="flex justify-start animate-msg-in">
                <div className="w-[92%] sm:w-[85%] bg-gold-500/10 border border-gold-500/30 rounded-2xl rounded-tl-md p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-gold-500/15 text-gold-600">
                      <Headset className="w-3.5 h-3.5" />
                    </span>
                    <p className="font-bold text-xs text-gold-600">Admin sedang sibuk</p>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <button
                    onClick={handleEscalate}
                    className="w-full py-2.5 bg-whatsapp-600 hover:bg-whatsapp-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-sm"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    Chat WhatsApp 0851-7988-0092
                  </button>
                </div>
              </div>
            );
          }

          if (msg.kind === 'handover') {
            return (
              <div key={idx} className="flex items-start gap-2.5 animate-msg-in">
                <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-success-700 border border-success-600 shadow-xs flex items-center justify-center">
                  <Headset className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="max-w-[85%] sm:max-w-[75%] bg-success-600/10 border border-success-600/20 text-success-700 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm shadow-xs whitespace-pre-wrap break-words leading-relaxed">
                  <MessageText text={msg.content} />
                </div>
              </div>
            );
          }

          if (msg.kind === 'admin') {
            return (
              <div key={idx} className="flex items-start gap-2.5 animate-msg-in">
                <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-success-700 to-success-600 border border-success-600 shadow-xs flex items-center justify-center">
                  <Headset className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="max-w-[85%] sm:max-w-[75%] bg-white border border-success-600/20 text-ink-800 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm shadow-xs whitespace-pre-wrap break-words leading-relaxed">
                  <span className="text-[10px] font-bold text-success-700 uppercase tracking-wider">Admin</span>
                  <p className="mt-1">
                    <MessageText text={msg.content} />
                  </p>
                </div>
              </div>
            );
          }

          if (msg.kind === 'error') {
            return (
              <div key={idx} className="flex justify-start animate-msg-in">
                <div className="w-[92%] sm:w-[85%] bg-danger-600/5 border border-danger-600/20 rounded-2xl rounded-tl-md p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-danger-600/10 text-danger-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <p className="font-bold text-xs text-danger-700">{t('contact.ai.errorTitle')}</p>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">{t('contact.ai.errorDesc')}</p>
                  <button
                    onClick={retry}
                    disabled={isTyping}
                    className="w-full py-2.5 bg-ink-900 hover:bg-ink-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('contact.ai.retry')}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2.5 animate-msg-in">
              <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-ink-900 to-ink-950 border border-cream-300 shadow-xs flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-peach-300" />
              </div>
              <div className="max-w-[85%] sm:max-w-[75%] bg-white border border-cream-300 text-ink-700 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm shadow-xs whitespace-pre-wrap break-words leading-relaxed">
                <MessageText text={msg.content} />
              </div>
            </div>
          );
        })}

        {isAdminTyping && !isTyping && (
          <div className="flex items-start gap-2.5 animate-msg-in">
            <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-success-700 border border-success-600 shadow-xs flex items-center justify-center">
              <Headset className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-success-600/20 rounded-2xl rounded-tl-md px-4 py-3.5 shadow-xs flex items-center gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-whatsapp-600 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
              <span className="sr-only">Admin mengetik...</span>
            </div>
          </div>
        )}
        {isTyping && !handoverActive && !isAdminTyping && (
          <div className="flex items-start gap-2.5 animate-msg-in">
            <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-ink-900 to-ink-950 border border-cream-300 shadow-xs flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-peach-300" />
            </div>
            <div className="bg-white border border-cream-300 rounded-2xl rounded-tl-md px-4 py-3.5 shadow-xs flex items-center gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-ember-600 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
              <span className="sr-only">{t('contact.ai.thinking')}</span>
            </div>
          </div>
        )}
      </div>

      {/* --- INPUT --- */}
      <div className="border-t border-cream-300 bg-white px-3 py-3 sm:px-4">
        <div className="flex items-end gap-2 bg-cream-100 border border-cream-300 rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:border-ember-600 focus-within:ring-2 focus-within:ring-ember-600/20 transition">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={handoverActive ? 'Ketik pesan untuk admin...' : t('contact.ai.placeholder')}
            aria-label={t('contact.ai.send')}
            maxLength={1000}
            className="flex-1 resize-none bg-transparent focus:outline-none text-sm py-2 placeholder:text-ink-500 max-h-28"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            aria-label={t('contact.ai.send')}
            className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-ember-600 to-ember-700 text-white flex items-center justify-center shadow-md shadow-ember-600/30 hover:brightness-105 active:scale-90 transition disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 -translate-x-px" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-ink-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            {t('contact.ai.disclaimer')}
          </p>
          {!handoverActive && (
            <button onClick={requestHandover} disabled={isTyping} className="text-[10px] font-bold text-success-700 hover:text-success-700 flex items-center gap-1 disabled:opacity-50">
              <Headset size={12} /> Hubungkan admin
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
