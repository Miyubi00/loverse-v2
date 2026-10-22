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
import { AlertTriangle, ArrowRight, Headset, MessageCircle, RotateCcw, Send, ShieldCheck, X } from 'lucide-react';
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
    'font-medium text-ember-700 underline underline-offset-2 hover:text-ink-900 hover:bg-cream-200 rounded-sm break-all transition-colors cursor-pointer';
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

function TypingLine({ label, tone }: { label: string; tone: 'ember' | 'success' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2.5 border-l-2 pl-3.5 ${
        tone === 'success' ? 'border-success-600' : 'border-ember-500'
      }`}
    >
      <span className="text-[13px] leading-relaxed text-ink-500">{label}</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className={`h-1 w-1 rounded-full motion-reduce:animate-none ${
              tone === 'success' ? 'bg-success-600 animate-pulse' : 'bg-ember-600 animate-pulse'
            }`}
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

const MAX_MESSAGE_LENGTH = 250;

export default function AiAssistant({ waNumber }: AiAssistantProps) {
  const { t } = useTranslation();
  const { messages, isTyping, isAdminTyping, send, retry, handoverActive, closeHandover, requestHandover } = useAiChat();

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length === 0) {
      el.scrollTo({ top: 0 });
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages, isTyping, handoverActive]);

  const canSend = draft.trim().length > 0 && !isTyping;

  const handleSend = () => {
    if (!canSend) return;
    send(draft);
    setDraft('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleEscalate = () => {
    const text = t('contact.ai.escalationMessage');
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[4px] border border-ink-900/15 bg-cream-50">
      <div className="bg-ink-900 px-4 py-4 text-cream-100 sm:px-5 sm:py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cream-100/15 bg-ink-950 p-2.5">
            <img src="/logo.svg" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-data text-[12px] leading-tight text-champagne/90">{t('contact.sectionAi')}</p>
              <span className="h-0.5 w-0.5 rounded-full bg-cream-100/40" aria-hidden="true" />
              <p className="font-data text-[12px] leading-tight text-cream-100/60">{t('contact.sectionAiDesc')}</p>
            </div>

            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-display text-[22px] leading-tight tracking-[-0.03em] text-cream-50 sm:text-[24px]">
                {handoverActive ? t('contact.ai.adminName') : t('contact.ai.title')}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[13px] leading-tight text-cream-100/75">
                <span className="h-1.5 w-1.5 rounded-full bg-success-dark" aria-hidden="true" />
                {handoverActive ? t('contact.ai.connected') : t('contact.ai.onlineChip')}
              </span>
            </div>

            <p className="mt-1 text-[14px] leading-relaxed text-cream-100/65">
              {handoverActive ? t('contact.ai.connectedHint') : t('contact.ai.subtitle')}
            </p>
          </div>

          {handoverActive && (
            <button type="button"
              onClick={closeHandover}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-cream-100/20 px-2.5 text-[13px] font-medium text-cream-50 transition-colors hover:bg-cream-50/10"
            >
              <X size={13} aria-hidden="true" /> {t('contact.ai.endHandover')}
            </button>
          )}
        </div>
      </div>

      {handoverActive && (
        <div className="flex items-center gap-2 border-b border-success-600/20 bg-success-600/10 px-4 py-2.5 text-[13px] text-success-700">
          <MessageCircle size={14} className="shrink-0" aria-hidden="true" />
          <span className="font-medium">{t('contact.ai.connected')}</span>
        </div>
      )}

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="chat-scroll min-h-[420px] max-h-[560px] flex-1 space-y-4 overflow-y-auto bg-cream-50 px-4 py-4 sm:px-5 sm:py-5"
      >
        {messages.length === 0 && !isTyping && (
          <div className="animate-msg-in motion-reduce:animate-none">
            <p className="text-[14px] leading-relaxed text-ink-600">{t('contact.ai.greeting')}</p>

            <div className="mt-4 divide-y divide-ink-900/12 border-t border-ink-900/12">
              {SUGGESTION_KEYS.map((key, index) => (
                <button type="button"
                  key={key}
                  onClick={() => send(t(key))}
                  disabled={isTyping}
                  className="group flex min-h-12 w-full items-center gap-3 px-1 py-3 text-left text-[14px] leading-snug text-ink-800 transition-colors hover:bg-cream-200/60 focus-visible:bg-cream-200/60 focus-visible:outline-offset-[-2px] disabled:opacity-50 motion-reduce:transition-none"
                >
                  <span className="font-data text-[12px] tabular-nums text-ink-400" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span className="min-w-0 flex-1">{t(key)}</span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>

            <button type="button"
              onClick={requestHandover}
              disabled={isTyping}
              className="group flex min-h-12 w-full items-center justify-between border-t border-ink-900/25 px-1 py-3 text-left text-[14px] font-medium leading-snug text-ink-900 transition-colors hover:bg-cream-200/60 focus-visible:bg-cream-200/60 focus-visible:outline-offset-[-2px] disabled:opacity-50 motion-reduce:transition-none"
            >
              <span>{t('contact.ai.connectAdmin')}</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex justify-end animate-msg-in motion-reduce:animate-none">
                <div className="max-w-[85%] rounded-[4px] bg-ink-900 px-3.5 py-2.5 text-[14px] leading-relaxed text-cream-50 whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.kind === 'busy') {
            return (
              <div key={idx} className="animate-msg-in motion-reduce:animate-none">
                <div className="max-w-[92%] rounded-[4px] border border-gold-500/40 bg-gold-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                    <p className="text-[14px] font-medium text-gold-600">{t('contact.ai.busyTitle')}</p>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{t('contact.ai.busyDesc')}</p>
                  <button type="button"
                    onClick={handleEscalate}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-whatsapp-600 px-4 text-[14px] font-medium text-white transition-colors hover:bg-whatsapp-700"
                  >
                    <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                    {t('contact.ai.chatAdmin')}
                  </button>
                </div>
              </div>
            );
          }

          if (msg.kind === 'handover_busy') {
            return (
              <div key={idx} className="animate-msg-in motion-reduce:animate-none">
                <div className="max-w-[92%] rounded-[4px] border border-gold-500/40 bg-gold-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <Headset className="h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                    <p className="text-[14px] font-medium text-gold-600">{t('contact.ai.adminBusy')}</p>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-600 whitespace-pre-wrap">{msg.content}</p>
                  <button type="button"
                    onClick={handleEscalate}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-whatsapp-600 px-4 text-[14px] font-medium text-white transition-colors hover:bg-whatsapp-700"
                  >
                    <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                    {t('contact.ai.chatWhatsapp', { number: '0851-7988-0092' })}
                  </button>
                </div>
              </div>
            );
          }

          if (msg.kind === 'handover') {
            return (
              <div
                key={idx}
                className="max-w-[92%] animate-msg-in border-l-2 border-success-600 pl-3.5 text-[14px] leading-relaxed text-ink-700 whitespace-pre-wrap break-words motion-reduce:animate-none"
              >
                <MessageText text={msg.content} />
              </div>
            );
          }

          if (msg.kind === 'admin') {
            return (
              <div
                key={idx}
                className="max-w-[92%] animate-msg-in border-l-2 border-success-600 pl-3.5 motion-reduce:animate-none"
              >
                <p className="text-[12px] font-medium leading-tight text-success-700">{t('contact.ai.adminLabel')}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-700 whitespace-pre-wrap break-words">
                  <MessageText text={msg.content} />
                </p>
              </div>
            );
          }

          if (msg.kind === 'error') {
            return (
              <div key={idx} className="animate-msg-in motion-reduce:animate-none">
                <div className="max-w-[92%] rounded-[4px] border border-danger-600/25 bg-danger-600/5 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-danger-600" aria-hidden="true" />
                    <p className="text-[14px] font-medium text-danger-700">{t('contact.ai.errorTitle')}</p>
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{t('contact.ai.errorDesc')}</p>
                  <button type="button"
                    onClick={retry}
                    disabled={isTyping}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[4px] bg-ink-900 px-4 text-[14px] font-medium text-cream-50 transition-colors hover:bg-ink-950 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('contact.ai.retry')}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="max-w-[92%] animate-msg-in border-l-2 border-ember-500 pl-3.5 text-[14px] leading-relaxed text-ink-700 whitespace-pre-wrap break-words motion-reduce:animate-none"
            >
              <MessageText text={msg.content} />
            </div>
          );
        })}

        {isAdminTyping && !isTyping && <TypingLine label={t('contact.ai.adminTyping')} tone="success" />}
        {isTyping && !handoverActive && !isAdminTyping && (
          <TypingLine label={t('contact.ai.thinking')} tone="ember" />
        )}
      </div>

      <div className="border-t border-ink-900/15 bg-cream-50 p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            name="message"
            autoComplete="off"
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
            placeholder={handoverActive ? t('contact.ai.adminPlaceholder') : t('contact.ai.placeholder')}
            aria-label={handoverActive ? t('contact.ai.adminPlaceholder') : t('contact.ai.placeholder')}
            maxLength={MAX_MESSAGE_LENGTH}
            aria-describedby="ai-message-character-count"
            className="min-h-11 max-h-28 min-w-0 flex-1 resize-none rounded-[3px] border border-ink-900/25 bg-cream-50 px-3 py-2.5 text-[16px] leading-relaxed text-ink-950 placeholder:text-ink-500 transition-colors focus:border-ember-600 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ember-500"
          />
          <button type="button"
            onClick={handleSend}
            disabled={!canSend}
            aria-label={t('contact.ai.send')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-peach-300 text-ink-950 transition-colors hover:bg-peach-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-1 flex justify-end">
          <span id="ai-message-character-count" className="font-data text-[11px] tabular-nums text-ink-500">
            {t('contact.ai.characterCount', { count: String(draft.length), max: String(MAX_MESSAGE_LENGTH) })}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="flex items-center gap-1.5 text-[13px] leading-snug text-ink-500">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('contact.ai.disclaimer')}
          </p>
          {!handoverActive && (
            <button type="button"
              onClick={requestHandover}
              disabled={isTyping}
              className="inline-flex min-h-11 items-center gap-1 text-[13px] font-medium text-ink-700 transition-colors hover:text-ink-950 disabled:opacity-50"
            >
              <Headset size={13} aria-hidden="true" /> {t('contact.ai.connectAdminShort')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
