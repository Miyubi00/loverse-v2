import { Link } from "react-router-dom";
import { ArrowUpRight, Eye } from "lucide-react";
import { SkeletonImage } from "../ui/SkeletonImage";
import { useTranslation } from "../../i18n";
import type { TemplateRow } from "../../types/database";

const PRETTY_NAMES: Record<string, string> = {
  iphone: "iPhone",
};
const prettifyName = (name: string) => PRETTY_NAMES[name.toLowerCase()] ?? name;

interface TemplateCatalogCardProps {
  template: TemplateRow & { image: string };
  priceLabel: string;
}

export default function TemplateCatalogCard({ template, priceLabel }: TemplateCatalogCardProps) {
  const { t } = useTranslation();
  const demoUrl = `/demo/${template.slug}`;
  const orderUrl = `/order?template=${template.slug}`;

  return (
    <article data-template-slug={template.slug} className="group relative">
      <Link
        to={demoUrl}
        title={`Lihat demo ${template.name}`}
        className="relative block aspect-[3/4] overflow-hidden bg-ink-900"
      >
        <SkeletonImage
          src={template.image}
          alt={`Pratinjau tema ${template.name}`}
          width={800}
          height={1066}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.045]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/88 via-ink-950/10 to-ink-950/15" />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cream-50/40 bg-cream-50/12 text-cream-50 backdrop-blur-md">
            <Eye className="h-4 w-4" />
          </span>
        </div>

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="border border-cream-50/25 bg-ink-950/18 px-2 py-1 font-data text-[8px] uppercase tracking-[0.18em] text-cream-50/85 backdrop-blur-sm">
            {template.category ?? "Basic"}
          </span>
          <span className="font-data text-[9px] text-cream-50/55">No. {String(template.id ?? "").padStart(2, "0") || "—"}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="eyebrow text-peach-300/90">{t("home.catalogPreview")}</p>
          <h3 className="mt-2 font-display text-[clamp(1.35rem,3vw,1.8rem)] leading-none tracking-[-0.035em] text-cream-50">
            {prettifyName(template.name)}
          </h3>
        </div>
      </Link>

      <div className="flex items-stretch justify-between border-b border-ink-900/15">
        <Link
          to={orderUrl}
          className="flex min-h-11 flex-1 items-center justify-between px-1 py-3 text-[11px] font-semibold tracking-[0.01em] text-ink-800 transition-colors hover:text-ember-600"
        >
          <span>{t("home.catalogCreate")}</span>
          <span className="font-data text-[10px] text-ink-500">{priceLabel}</span>
        </Link>
        <Link
          to={demoUrl}
          aria-label={`Buka demo ${template.name}`}
          className="flex w-11 items-center justify-center border-l border-ink-900/15 text-ink-400 transition-colors hover:bg-ink-950 hover:text-cream-50"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
