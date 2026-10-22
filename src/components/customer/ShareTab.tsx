// ============================================================
// src/components/customer/ShareTab.tsx
// ------------------------------------------------------------
// Tab "Sebar Undangan" dashboard mempelai: link personal tamu, share WhatsApp, dan import daftar tamu Excel.
// Dipakai di  : pages/CustomerDashboardPage.tsx
// Keterikatan : hooks/useShareLink, components/shared/form/ui
// ============================================================

import {
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { ArrowUpRight, Copy, Download, FileSpreadsheet, Phone, Send, Users } from "lucide-react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";
import Button from "../ui/Button";
import { buttonClass } from "../ui/buttonStyles";
import { useTranslation } from "../../i18n";

interface ShareTabProps {
  shareMode: string;
  setShareMode: (mode: string) => void;
  guestName: string;
  setGuestName: Dispatch<SetStateAction<string>>;
  generatedLink: string;
  excelGuests: string[];
  setExcelGuests: Dispatch<SetStateAction<string[]>>;
  handleShareWa: (name: string) => void;
  handleGenerateManual: (e: FormEvent<HTMLFormElement>) => void;
  handleFileUploadExcel: (e: ChangeEvent<HTMLInputElement>) => void;
  copyLink: (name: string) => void;
  downloadExampleCsv: () => void;
}

const inputClass =
  "h-12 w-full border border-ink-900/15 bg-cream-50 px-3.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15";

export default function ShareTab({
  shareMode,
  setShareMode,
  guestName,
  setGuestName,
  generatedLink,
  excelGuests,
  setExcelGuests,
  handleShareWa,
  handleGenerateManual,
  handleFileUploadExcel,
  copyLink,
  downloadExampleCsv,
}: ShareTabProps) {
  const { t } = useTranslation();
  const copyToClipboard = useCopyToClipboard();

  const modes = [
    { id: "manual", label: t("customer.share.tabManual"), index: "01" },
    { id: "excel", label: t("customer.share.tabExcel"), index: "02" },
  ] as const;

  return (
    <div className="space-y-7">
      <div className="flex w-full flex-col gap-1 border border-ink-900/12 bg-cream-50 p-1.5 sm:w-fit sm:flex-row">
        {modes.map((mode) => {
          const active = shareMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setShareMode(mode.id)}
              aria-pressed={active}
              className={`flex min-h-11 items-center justify-start gap-4 px-4 text-left transition-colors ${
                active
                  ? "bg-ink-950 text-cream-50"
                  : "text-ink-500 hover:bg-cream-100 hover:text-ink-900"
              }`}
            >
              <span className={`font-data text-[14px] ${active ? "text-champagne" : "text-ink-400"}`}>
                {mode.index}
              </span>
              <span className="text-[14px] font-semibold tracking-[-0.01em]">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {shareMode === "manual" && (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <section className="paper-panel p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-ink-900/12 pb-5">
              <div className="flex max-w-md gap-4">
                <span className="mt-1 font-display text-[2.6rem] leading-none tracking-[-0.06em] text-ink-400">
                  01
                </span>
                <div>
                  <h2 className="font-display text-[clamp(1.5rem,3vw,2.1rem)] leading-[1.02] tracking-[-0.04em] text-ink-950">
                    {t("customer.share.manualHeading")}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
                    {t("customer.share.manualSub")}
                  </p>
                </div>
              </div>
              <Send className="mt-1 h-4 w-4 shrink-0 text-ember-600" strokeWidth={1.5} />
            </div>

            <form onSubmit={handleGenerateManual} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="share-guest-name"
                  className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400"
                >
                  {t("customer.share.thGuestName")}
                </label>
                <input
                  id="share-guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t("customer.share.guestNamePlaceholder")}
                  className={`${inputClass} mt-2`}
                />
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto" iconRight={<ArrowUpRight size={14} />}>
                {t("customer.share.btnCreateLink")}
              </Button>
            </form>
          </section>

          <section
            className={`relative flex min-h-[320px] flex-col overflow-hidden p-5 sm:p-7 ${
              generatedLink ? "grain bg-ink-950 text-cream-100" : "paper-panel"
            }`}
          >
            {generatedLink ? (
              <div className="relative z-[2] flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-champagne">{t("customer.share.successTitle")}</p>
                    <p className="mt-3 font-display text-2xl tracking-[-0.03em] text-cream-50">
                      {guestName || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(generatedLink, "Link")}
                    aria-label={t("customer.share.btnCopy")}
                    title={t("customer.share.btnCopy")}
                    className={buttonClass("outlineLight", "sm", "shrink-0 px-3")}
                  >
                    <Copy size={14} />
                  </button>
                </div>

                <div className="mt-5 border border-cream-100/15 bg-cream-50/[0.04] p-3">
                  <p className="font-data text-[14px] uppercase tracking-[0.06em] text-cream-100/75">
                    {t("customer.share.previewLabel")}
                  </p>
                  <p className="mt-1.5 break-all font-data text-[14px] leading-relaxed text-cream-100/75">
                    {generatedLink}
                  </p>
                </div>

                <div className="mt-auto grid gap-2 pt-6 sm:grid-cols-[1fr_auto]">
                  <Button
                    type="button"
                    variant="peach"
                    size="lg"
                    onClick={() => handleShareWa(guestName)}
                    icon={<Phone size={15} />}
                  >
                    {t("customer.share.btnSendWa")}
                  </Button>
                  <Button
                    type="button"
                    variant="outlineLight"
                    size="lg"
                    onClick={() => void copyToClipboard(generatedLink, "Link")}
                    icon={<Copy size={15} />}
                  >
                    {t("customer.share.btnCopy")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <p className="eyebrow text-ink-400">{t("customer.share.previewLabel")}</p>
                  <ArrowUpRight className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
                </div>
                <div className="py-10 text-center">
                  <p className="font-display text-[clamp(3rem,8vw,5rem)] leading-none tracking-[-0.07em] text-ink-400">
                    Aa
                  </p>
                  <p className="mx-auto mt-4 max-w-[26ch] text-[14px] leading-relaxed text-ink-400">
                    {t("customer.share.manualSub")}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-ink-900/10 pt-3 font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                  <span>LoVerse</span>
                  <span>Personal link</span>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {shareMode === "excel" && (
        <div className="space-y-5">
          <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <label className="group flex cursor-pointer flex-col justify-between border border-dashed border-ink-900/25 bg-cream-50 p-6 text-center transition-colors hover:border-ember-500 hover:bg-cream-200 sm:p-10">
              <span className="flex flex-col items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center border border-ink-900/12 bg-cream-100 text-ember-600 transition-colors group-hover:border-ember-500/40 group-hover:bg-cream-200">
                  <FileSpreadsheet className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <span className="mt-2 font-display text-[1.6rem] tracking-[-0.04em] text-ink-950">
                  {t("customer.share.excelHeading")}
                </span>
                <span className="max-w-sm text-[14px] leading-relaxed text-ink-500">
                  {t("customer.share.excelSub")}
                </span>
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUploadExcel}
                className="mx-auto mt-6 block w-full max-w-xs cursor-pointer text-[14px] text-ink-500 file:mr-3 file:cursor-pointer file:border-0 file:bg-ink-950 file:px-3.5 file:py-2.5 file:text-[14px] file:font-semibold file:uppercase file:tracking-[0.06em] file:text-cream-50 hover:file:bg-ember-600"
              />
            </label>

            <div className="paper-panel flex flex-col p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-ink-900/12 pb-4">
                <div>
                  <p className="eyebrow text-ink-400">{t("customer.share.csvExampleTitle")}</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-500">
                    {t("customer.share.csvExampleSub")}
                  </p>
                </div>
                <Download className="h-4 w-4 shrink-0 text-ember-600" strokeWidth={1.5} />
              </div>

              <div className="mt-4 overflow-hidden border border-ink-900/12">
                <table className="w-full text-left text-[14px] text-ink-600">
                  <thead className="border-b border-ink-900/12 bg-cream-100 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">{t("customer.share.thGuestName")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Budi & Keluarga", "Rina Dewi", "Keluarga Besar Haji Ahmad"].map((name) => (
                      <tr key={name} className="border-b border-ink-900/10 last:border-0">
                        <td className="px-3 py-2.5">{name}</td>
                      </tr>
                    ))}
                    <tr className="text-ink-400">
                      <td className="px-3 py-2.5 italic">…dst.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-ink-900/10 pt-3 text-[14px] leading-relaxed text-ink-400">
                <li>{t("customer.share.csvTip1")}</li>
                <li>{t("customer.share.csvTip2")}</li>
              </ul>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={downloadExampleCsv}
                className="mt-4 self-start"
                icon={<Download size={13} />}
              >
                {t("customer.share.btnDownloadCsv")}
              </Button>
            </div>
          </section>

          {excelGuests.length > 0 && (
            <section className="paper-panel overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-ink-900/12 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Users size={15} className="text-ember-600" strokeWidth={1.5} />
                  <h2 className="text-[14px] font-semibold text-ink-900">
                    {t("customer.share.guestListTitle", { count: excelGuests.length })}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setExcelGuests([])}
                  className="font-data text-[14px] uppercase tracking-[0.06em] text-danger-600 transition-colors hover:text-danger-700"
                >
                  {t("customer.share.btnClearAll")}
                </button>
              </div>
              <div className="max-h-[420px] divide-y divide-ink-900/10 overflow-y-auto">
                {excelGuests.map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-cream-100/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-6 shrink-0 font-data text-[14px] text-ink-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate text-[14px] font-medium text-ink-900">{name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copyLink(name)}
                        title={t("customer.share.btnCopy")}
                        aria-label={t("customer.share.btnCopy")}
                        className="grid h-8 w-8 place-items-center text-ink-400 transition-colors hover:bg-cream-100 hover:text-ember-600"
                      >
                        <Copy size={14} />
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleShareWa(name)}
                        icon={<Send size={12} />}
                      >
                        {t("customer.share.btnSendWa")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
