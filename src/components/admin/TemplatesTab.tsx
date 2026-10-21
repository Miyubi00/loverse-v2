import { useState } from "react";
import { Filter, Save, Search, ToggleLeft, ToggleRight, Trash2, Zap } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import type { Dispatch, SetStateAction } from "react";
import type { TemplateRow } from "../../types/database";
import type { ToastApi } from "../GlobalToast";
import Pagination from "../shared/Pagination";
import Button from "../ui/Button";
import { usePagination } from "../../hooks/usePagination";
import { useTranslation } from "../../i18n";

interface TemplatesTabProps {
  templates: TemplateRow[];
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  confirmAction: (title: string, message: string, isDanger: boolean, onConfirm: () => void) => void;
  fetchData: () => Promise<void>;
  toast: ToastApi;
  loading: boolean;
}

const INPUT_CLASS =
  "h-10 w-full border border-ink-900/15 bg-cream-50 px-3 text-[14px] font-medium text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-ember-500 focus:bg-white focus:ring-2 focus:ring-ember-500/15";

const LABEL_CLASS =
  "mb-1.5 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-500";

const TH_CLASS =
  "px-4 py-3.5 font-data text-[14px] font-medium uppercase tracking-[0.06em] text-ink-500";

export default function TemplatesTab({ templates, searchTerm, setSearchTerm, confirmAction, fetchData, toast, loading }: TemplatesTabProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [categoryInput, setCategoryInput] = useState("All");

  const [appliedCategory, setAppliedCategory] = useState("All");

  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [bulkPrice, setBulkPrice] = useState("");

  const handleApplyFilters = () => {
    setSearchTerm(searchInput);
    setAppliedCategory(categoryInput);
  };

  const hasFilter = Boolean(searchTerm) || appliedCategory !== "All";

  const resetFilters = () => {
    setSearchTerm("");
    setSearchInput("");
    setCategoryInput("All");
    setAppliedCategory("All");
  };

  const filteredTemplates = templates.filter((t) => {
    const matchSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = appliedCategory === "All" || t.category === appliedCategory;
    return matchSearch && matchCategory;
  });

  const tplPg = usePagination(filteredTemplates, `${searchTerm}|${appliedCategory}`);

  const handleToggleTemplateActive = async (slug: string, currentStatus: boolean) => {
    const { count, error } = await supabase
      .from("templates")
      .update({ is_active: !currentStatus }, { count: "exact" })
      .eq("slug", slug);
    if (!error && (count ?? 0) > 0) {
      toast.success(t("toast.templateStatusChanged", { status: !currentStatus ? t("common.active") : t("common.inactive") }));
      fetchData();
    } else if (!error) {
      toast.error(t("toast.changeStatusNoChange"));
    } else {
      toast.error(t("toast.changeStatusFailed"));
    }
  };

  const handleUpdateTemplatePrice = async (slug: string) => {
    const newPrice = editPrices[slug];
    if (!newPrice || isNaN(Number(newPrice))) return toast.error(t("toast.invalidPrice"));
    const { count, error } = await supabase
      .from("templates")
      .update({ price: parseInt(newPrice) }, { count: "exact" })
      .eq("slug", slug);
    if (!error && (count ?? 0) > 0) {
      toast.success(t("toast.priceUpdatedSuccess"));
      fetchData();
    } else if (!error) {
      toast.error(t("toast.priceUpdateNoChange"));
    } else {
      toast.error(t("toast.priceUpdateFailed"));
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkPrice || isNaN(Number(bulkPrice))) return toast.warning(t("toast.invalidPrice"));
    if (filteredTemplates.length === 0) return toast.warning(t("admin.templateNotFound"));

    confirmAction(
      "Ubah Harga Massal?",
      `Anda yakin ingin mengubah harga untuk ${filteredTemplates.length} template yang tampil saat ini menjadi Rp ${new Intl.NumberFormat("id-ID").format(Number(bulkPrice))}?`,
      false,
      async () => {
        const slugsToUpdate = filteredTemplates.map((t) => t.slug);
        const expected = slugsToUpdate.length;
        const { count, error } = await supabase
          .from("templates")
          .update({ price: parseInt(bulkPrice) }, { count: "exact" })
          .in("slug", slugsToUpdate);

        if (!error && (count ?? 0) === expected) {
          toast.success(t("toast.bulkPriceApplied"));
          setBulkPrice("");
          fetchData();
        } else if (!error && (count ?? 0) > 0) {
          toast.warning(`Sebagian berhasil: ${count} dari ${expected} template terupdate.`);
          fetchData();
        } else if (!error) {
          toast.error(t("toast.bulkPriceNoChange"));
        } else {
          toast.error(t("toast.bulkPriceFailed"));
        }
      },
    );
  };

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow text-ember-600">Control / Catalog</p>
        <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3.1rem)] leading-none tracking-[-0.05em] text-ink-950">
          {t("admin.templatesTitle")}
        </h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-500">
          {t("admin.templatesSubtitle")}
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }}
        className="mb-6 paper-panel flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-end lg:w-auto">
          <div className="min-w-[220px] flex-1">
            <label className={LABEL_CLASS}>
              <Search size={12} className="text-ember-600" />
              <span>{t("admin.tplSearchLabel")}</span>
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                placeholder={t("admin.tplSearchPlaceholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
          </div>

          <div className="min-w-[160px]">
            <label className={LABEL_CLASS}>
              <Filter size={12} className="text-ember-600" />
              <span>{t("admin.tplCategoryLabel")}</span>
            </label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="All">{t("admin.tplCategoryAll")}</option>
              <option value="Basic">Basic</option>
              <option value="RSVP">RSVP</option>
            </select>
          </div>

          <div className="flex shrink-0 gap-1.5">
            {hasFilter && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                icon={<Trash2 size={12} />}
                className="h-10 text-danger-600 hover:bg-danger-600/5 hover:text-danger-700"
              >
                {t("admin.btnResetFilter")}
              </Button>
            )}
            <Button type="submit" size="sm" icon={<Search size={12} />} className="h-10 whitespace-nowrap">
              {t("admin.btnSearch")}
            </Button>
          </div>
        </div>

        <div className="flex items-end gap-2 border border-ink-900/12 bg-cream-100/70 p-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ember-600">
              <Zap size={12} /> {t("admin.bulkPriceLabel")}
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-data text-[14px] text-ink-400">Rp</span>
              <input
                type="number"
                placeholder={t("admin.bulkPricePlaceholder")}
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="h-10 w-32 border border-ink-900/15 bg-cream-50 pl-8 pr-2 text-[14px] font-semibold text-ink-900 outline-none transition focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15"
              />
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleBulkPriceUpdate} className="h-10">
            {t("admin.btnApplyBulk")}
          </Button>
        </div>
      </form>

      <div className="paper-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] text-ink-600">
            <thead className="border-b border-ink-900/12 bg-cream-100">
              <tr>
                <th className={TH_CLASS}>{t("admin.thTemplateName")}</th>
                <th className={TH_CLASS}>{t("admin.thCategory")}</th>
                <th className={TH_CLASS}>{t("admin.thPrice")}</th>
                <th className={`${TH_CLASS} text-center`}>{t("admin.thStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                    {t("admin.loadingTemplates")}
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[14px] italic text-ink-400">
                    {t("admin.templateNotFound")}
                  </td>
                </tr>
              ) : (
                tplPg.pageItems.map((template) => (
                  <tr
                    key={template.slug}
                    className={`transition-colors ${template.is_active ? "hover:bg-cream-100/50" : "bg-cream-100/40 opacity-70"}`}
                  >
                    <td className="px-4 py-4">
                      <div className="font-display text-lg leading-tight tracking-[-0.03em] text-ink-950">{template.name}</div>
                      <div className="mt-1 font-data text-[14px] text-ink-400">/{template.slug}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block border px-2 py-1 font-data text-[14px] uppercase tracking-[0.06em] ${
                          template.category === "RSVP"
                            ? "border-ember-500/30 bg-peach-100 text-ember-600"
                            : "border-ink-900/15 bg-cream-100 text-ink-600"
                        }`}
                      >
                        {template.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-data text-[14px] text-ink-400">Rp</span>
                          <input
                            type="number"
                            value={editPrices[template.slug] ?? template.price}
                            onChange={(e) => setEditPrices((prev) => ({ ...prev, [template.slug]: e.target.value }))}
                            aria-label={`${t("admin.thPrice")} ${template.name}`}
                            className="h-10 w-32 border border-ink-900/15 bg-cream-50 pl-8 pr-2 text-[14px] font-semibold text-ink-900 outline-none transition focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15"
                          />
                        </div>
                        {Number(editPrices[template.slug]) != template.price && (
                          <button
                            type="button"
                            onClick={() => handleUpdateTemplatePrice(template.slug)}
                            title="Simpan Harga Baru"
                            className="grid h-10 w-10 place-items-center border border-ink-950 bg-ink-950 text-cream-50 transition-colors hover:bg-ember-600"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleTemplateActive(template.slug, template.is_active ?? false)}
                        className={`mx-auto flex w-full max-w-[132px] items-center justify-center gap-2 border px-3 py-2 font-data text-[14px] uppercase tracking-[0.06em] transition-colors ${
                          template.is_active
                            ? "border-success-600/25 bg-success-600/[0.06] text-success-700 hover:bg-success-600/10"
                            : "border-danger-600/25 bg-danger-600/[0.06] text-danger-600 hover:bg-danger-600/10"
                        }`}
                      >
                        {template.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        {template.is_active ? t("admin.statusActive") : t("admin.statusInactive")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredTemplates.length > 0 && (
          <Pagination
            page={tplPg.page}
            totalPages={tplPg.totalPages}
            total={tplPg.total}
            pageSize={tplPg.pageSize}
            onPageChange={tplPg.setPage}
            onPageSizeChange={tplPg.setPageSize}
          />
        )}
      </div>
    </div>
  );
}
