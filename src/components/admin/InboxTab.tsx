import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  CheckCheck,
  FileText,
  Inbox,
  Mail,
  MailOpen,
  Paperclip,
  RefreshCw,
  Reply,
  Send,
  User,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { ToastApi } from '../GlobalToast';
import Button from '../ui/Button';
import { useTranslation } from '../../i18n';

export interface InboxAttachment {
  name: string;
  mime: string;
  size: number;
  url: string;
}

export interface InboxMessage {
  id: string;
  from_addr: string;
  to_addr: string;
  subject: string;
  text_body: string;
  /** Badan HTML mentah (opsional); render WAJIB via iframe tersandbox. */
  html_body?: string | null;
  received_at: string;
  is_read: boolean;
  replied_at: string | null;
  attachments?: InboxAttachment[];
}

interface InboxTabProps {
  toast: ToastApi;
  onCountChange?: (unread: number) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function initialOf(email: string): string {
  const c = (email || '?').trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(c) ? c : '?';
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Pecah teks jadi segmen; URL jadi tautan biru bergaris bawah (aman, tanpa dangerouslySetInnerHTML). */
function renderLinkified(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /https?:\/\/[^\s<>"'`\]]+/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    let url = m[0];
    let trail = '';
    while (url.length > 0 && /[.,;:!?)]$/.test(url)) {
      trail = url.slice(-1) + trail;
      url = url.slice(0, -1);
    }
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (url) {
      parts.push(
        <a key={k++} href={url} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-ember-600 underline">
          {url}
        </a>,
      );
    }
    if (trail) parts.push(trail);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : [text];
}

const MAX_ATTACH_FILES = 3;
const MAX_ATTACH_EACH = 5 * 1024 * 1024;

function isImageAtt(a: { mime: string; name: string }): boolean {
  return a.mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.name);
}

function isPdfAtt(a: { mime: string; name: string }): boolean {
  return a.mime === 'application/pdf' || /\.pdf$/i.test(a.name);
}

function readFileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? '');
      resolve(s.includes(',') ? s.split(',').slice(1).join(',') : s);
    };
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
}

export default function InboxTab({ toast, onCountChange }: InboxTabProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [viewHtml, setViewHtml] = useState(true);
  const [reply, setReply] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [attaches, setAttaches] = useState<Array<{ file: File; url: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlsRef = useRef<string[]>([]);

  // Revoke sisa object URL saat komponen dilepas.
  useEffect(() => {
    const ref = urlsRef;
    return () => {
      ref.current.forEach((u) => URL.revokeObjectURL(u));
      ref.current = [];
    };
  }, []);

  const applyRows = useCallback(
    (rows: InboxMessage[]) => {
      setMessages(rows);
      onCountChange?.(rows.filter((m) => !m.is_read).length);
      setSelected((prev) => (prev ? rows.find((m) => m.id === prev.id) ?? null : null));
    },
    [onCountChange],
  );

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('inbound_emails')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100);
    if (error) {
      toast.error(t('admin.inboxLoadFail'));
      return;
    }
    applyRows((data ?? []) as InboxMessage[]);
  }, [toast, t, applyRows]);

  const refreshMessages = async () => {
    setLoading(true);
    try {
      await fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      await fetchMessages();
      if (mounted) setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [fetchMessages]);

  const openMessage = async (msg: InboxMessage) => {
    setSelected(msg);
    setViewHtml(true);
    setReply('');
    setReplyOpen(false);
    setAttaches([]);
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    if (!msg.is_read) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
      onCountChange?.(messages.filter((m) => !m.is_read && m.id !== msg.id).length);
      await supabase.from('inbound_emails').update({ is_read: true }).eq('id', msg.id);
    }
  };

  const addAttachFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    if (attaches.length + picked.length > MAX_ATTACH_FILES) {
      toast.error(t('admin.inboxTooMany'));
    }
    for (const f of picked) {
      if (attaches.length >= MAX_ATTACH_FILES) break;
      if (f.size > MAX_ATTACH_EACH) {
        toast.error(t('admin.inboxFileTooBig', { name: f.name }));
        continue;
      }
      const url = URL.createObjectURL(f);
      urlsRef.current.push(url);
      setAttaches((prev) =>
        prev.length >= MAX_ATTACH_FILES ? prev : [...prev, { file: f, url }],
      );
    }
  };

  const removeAttachFile = (index: number) => {
    const target = attaches[index];
    if (target) {
      URL.revokeObjectURL(target.url);
      urlsRef.current = urlsRef.current.filter((u) => u !== target.url);
    }
    setAttaches((prev) => prev.filter((_, j) => j !== index));
  };

  const sendReply = async () => {
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      const attachments = [];
      for (const a of attaches) {
        attachments.push({ filename: a.file.name, content: await readFileBase64(a.file) });
      }
      const { data, error } = await supabase.functions.invoke('reply-email', {
        body: { id: selected.id, body: reply.trim(), attachments },
      });
      if (error || (data as { error?: string } | null)?.error) {
        toast.error((data as { error?: string } | null)?.error ?? t('admin.inboxReplyFail'));
        return;
      }
      toast.success(t('admin.inboxReplyOk'));
      setReply('');
      setReplyOpen(false);
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
      setAttaches([]);
      await fetchMessages();
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-ember-600">Control / Inbox</p>
          <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.05em] text-ink-950">
            {t('admin.inboxTitle')}
          </h2>
          <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-ink-500">{t('admin.inboxSubtitle')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void refreshMessages()}
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
        >
          {t('admin.inboxRefresh')}
        </Button>
      </div>

      {loading && messages.length === 0 ? (
        <div className="paper-panel px-6 py-12 text-center font-data text-[9px] uppercase tracking-[0.14em] text-ink-400">
          {t('common.loading')}
        </div>
      ) : messages.length === 0 ? (
        <div className="paper-panel flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center border border-ink-900/12 bg-cream-100 text-ember-600">
            <Inbox size={22} />
          </span>
          <p className="mt-4 text-[12px] italic text-ink-400">{t('admin.inboxEmpty')}</p>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="paper-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-900/10 bg-cream-100 px-4 py-3">
              <span className="font-data text-[8px] uppercase tracking-[0.14em] text-ink-500">Messages</span>
              <span className="font-data text-[9px] text-ink-400">{messages.length}</span>
            </div>
            <div className="max-h-[calc(100vh-16rem)] divide-y divide-ink-900/10 overflow-y-auto">
              {messages.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void openMessage(m)}
                  className={`flex w-full items-start gap-3 border-l-2 p-3.5 text-left transition-colors ${
                    selected?.id === m.id
                      ? 'border-ember-500 bg-peach-100/60'
                      : 'border-transparent hover:bg-cream-100/60'
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center border font-data text-[11px] font-semibold ${
                      m.is_read
                        ? 'border-ink-900/12 bg-cream-100 text-ink-400'
                        : 'border-ember-500/30 bg-ember-600 text-cream-50'
                    }`}
                  >
                    {initialOf(m.from_addr)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {m.is_read ? (
                        <MailOpen size={12} className="shrink-0 text-ink-300" />
                      ) : (
                        <Mail size={12} className="shrink-0 text-ember-600" />
                      )}
                      <span className={`truncate text-[11px] ${m.is_read ? 'font-medium text-ink-500' : 'font-semibold text-ink-900'}`}>
                        {m.from_addr}
                      </span>
                      {!m.is_read && <span className="ml-auto h-1.5 w-1.5 shrink-0 bg-ember-600" />}
                    </span>
                    <span className={`mt-1 block truncate text-[12px] ${m.is_read ? 'font-medium text-ink-600' : 'font-semibold text-ink-900'}`}>
                      {m.subject}
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-ink-400">
                      {(m.text_body || '').split('\n')[0]}
                    </span>
                    <span className="mt-2 flex items-center justify-between font-data text-[8px] uppercase tracking-[0.08em] text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={10} /> {formatDate(m.received_at)}
                      </span>
                      {m.replied_at && (
                        <span className="inline-flex items-center gap-1 text-success-700">
                          <CheckCheck size={10} /> {t('admin.inboxReplied')}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="paper-panel overflow-hidden">
            {!selected ? (
              <p className="flex items-center justify-center gap-2 px-6 py-16 text-center text-[12px] italic text-ink-400">
                <MailOpen size={15} /> {t('admin.inboxSelectHint')}
              </p>
            ) : (
              <div>
                <div className="border-b border-ink-900/10 bg-cream-100 px-5 py-4">
                  <p className="flex items-start gap-2.5">
                    <FileText size={17} className="mt-0.5 shrink-0 text-ember-600" />
                    <span className="font-display text-xl leading-snug tracking-[-0.03em] text-ink-950">{selected.subject}</span>
                  </p>
                  <div className="mt-3 grid gap-1.5 text-[11px] text-ink-500 sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <User size={12} className="shrink-0 text-ember-600" />
                      {t('admin.inboxFrom')} <strong className="font-semibold text-ink-800">{selected.from_addr}</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays size={12} className="shrink-0 text-ember-600" />
                      {formatDate(selected.received_at)}
                    </p>
                    <p className="flex items-center gap-2">
                      <BadgeCheck size={12} className={`shrink-0 ${selected.replied_at ? 'text-success-700' : 'text-ink-300'}`} />
                      {selected.replied_at ? (
                        <span className="font-semibold text-success-700">{t('admin.inboxReplied')}</span>
                      ) : (
                        <span>{t('admin.inboxUnread')}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-data text-[8px] uppercase tracking-[0.14em] text-ink-400">
                      {t('admin.inboxMessageLabel')}
                    </p>
                    {selected.html_body ? (
                      <span className="inline-flex overflow-hidden border border-ink-900/12">
                        <button
                          type="button"
                          onClick={() => setViewHtml(true)}
                          className={`px-2.5 py-1 font-data text-[8px] uppercase tracking-[0.08em] transition-colors ${viewHtml ? 'bg-ink-950 text-cream-50' : 'bg-cream-50 text-ink-500 hover:bg-cream-100'}`}
                        >
                          {t('admin.inboxViewHtml')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewHtml(false)}
                          className={`border-l border-ink-900/12 px-2.5 py-1 font-data text-[8px] uppercase tracking-[0.08em] transition-colors ${!viewHtml ? 'bg-ink-950 text-cream-50' : 'bg-cream-50 text-ink-500 hover:bg-cream-100'}`}
                        >
                          {t('admin.inboxViewText')}
                        </button>
                      </span>
                    ) : null}
                  </div>
                  {selected.html_body && viewHtml ? (
                    <iframe
                      title={selected.subject}
                      srcDoc={selected.html_body}
                      sandbox=""
                      className="h-[30rem] w-full border border-ink-900/12 bg-white"
                    />
                  ) : (
                    <div className="border-l-2 border-ember-500 bg-cream-100/60 p-4">
                      <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-ink-700">
                        {selected.text_body ? renderLinkified(selected.text_body) : `(${t('admin.inboxNoBody')})`}
                      </p>
                    </div>
                  )}
                </div>

                {(selected.attachments ?? []).length > 0 && (
                  <div className="px-5 pb-1">
                    <p className="mb-2 flex items-center gap-1.5 font-data text-[8px] uppercase tracking-[0.14em] text-ink-400">
                      <Paperclip size={11} /> {t('admin.inboxAttachments')} ({(selected.attachments ?? []).length})
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {(selected.attachments ?? []).map((a, i) =>
                        isImageAtt(a) ? (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${a.name} · ${formatSize(a.size)}`}
                            className="group relative block h-20 w-20 overflow-hidden border border-ink-900/12 bg-cream-100 hover:border-ember-500"
                          >
                            <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                            <span className="absolute inset-x-0 bottom-0 truncate bg-ink-950/75 px-1.5 py-0.5 text-[9px] font-medium text-cream-50">
                              {a.name}
                            </span>
                          </a>
                        ) : (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${a.name} · ${formatSize(a.size)}`}
                            className="flex w-44 items-center gap-2.5 border border-ink-900/12 bg-cream-50 p-2.5 hover:border-ember-500"
                          >
                            <span
                              className={`grid h-9 w-9 shrink-0 place-items-center font-data text-[8px] font-semibold ${
                                isPdfAtt(a) ? 'bg-danger-600/10 text-danger-600' : 'bg-cream-100 text-ink-500'
                              }`}
                            >
                              {isPdfAtt(a) ? 'PDF' : <FileText size={16} />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[11px] font-semibold text-ink-800">{a.name}</span>
                              <span className="block font-data text-[9px] text-ink-400">{formatSize(a.size)}</span>
                            </span>
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-ink-900/10 px-5 py-4">
                  {!replyOpen ? (
                    <Button type="button" size="sm" onClick={() => setReplyOpen(true)} icon={<Reply size={14} />}>
                      {t('admin.inboxReplyButton')}
                    </Button>
                  ) : (
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 font-data text-[8px] uppercase tracking-[0.14em] text-ink-500">
                        <Reply size={12} className="text-ember-600" /> {t('admin.inboxReplyLabel')}
                      </label>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={4}
                        placeholder={t('admin.inboxReplyPlaceholder')}
                        className="w-full border border-ink-900/15 bg-cream-50 p-3 text-[12px] text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                        className="hidden"
                        onChange={(e) => {
                          addAttachFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                      {attaches.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2.5">
                          {attaches.map((a, i) => {
                            const img = a.file.type.startsWith('image/');
                            const pdf = a.file.type === 'application/pdf' || /\.pdf$/i.test(a.file.name);
                            return (
                              <span key={i} className="group relative block">
                                {img ? (
                                  <img src={a.url} alt={a.file.name} className="h-20 w-20 border border-ink-900/12 object-cover" />
                                ) : (
                                  <span
                                    className={`flex h-20 w-20 flex-col items-center justify-center gap-1 border border-ink-900/12 font-data ${
                                      pdf ? 'bg-danger-600/10 text-danger-600' : 'bg-cream-100 text-ink-500'
                                    }`}
                                  >
                                    {pdf ? <span className="text-[10px] font-semibold">PDF</span> : <FileText size={18} />}
                                    <span className="max-w-[64px] truncate px-1 text-[8px] font-medium">{a.file.name}</span>
                                  </span>
                                )}
                                <span className="absolute -bottom-1 left-1 bg-ink-950/75 px-1.5 font-data text-[8px] text-cream-50">
                                  {formatSize(a.file.size)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeAttachFile(i)}
                                  aria-label={`Remove ${a.file.name}`}
                                  className="absolute -right-1.5 -top-1.5 bg-ink-950 p-0.5 text-cream-50 hover:bg-danger-600"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          icon={<Paperclip size={14} />}
                        >
                          {t('admin.inboxAttach')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void sendReply()}
                          disabled={sending || !reply.trim()}
                          icon={<Send size={14} />}
                        >
                          {sending ? t('admin.inboxSending') : t('admin.inboxSend')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyOpen(false);
                            setReply('');
                          }}
                        >
                          {t('admin.inboxCancel')}
                        </Button>
                      </div>
                      <p className="mt-1.5 font-data text-[8px] text-ink-400">{t('admin.inboxAttachHint')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
