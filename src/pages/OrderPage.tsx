import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useToast } from "../components/GlobalToast";
import ConfirmDialog from "../components/ConfirmDialog";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import type { TurnstileWidgetRef } from "../components/ui/TurnstileWidget";
import { MASTER_TEMPLATES, type MasterTemplate } from "../lib/constants";
import { goBackOrHome } from "../lib/navigation";
import { ArrowLeft, ArrowRight, Check, GraduationCap, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { OrderBackButton } from "../components/order/OrderBackButton";
import { OrderDetailsForm } from "../components/order/OrderDetailsForm";
import { OrderSteps } from "../components/order/OrderSteps";
import { PaymentMethodPicker } from "../components/order/PaymentMethodPicker";
import { OrderSummary } from "../components/order/OrderSummary";
import { OrderPayButton, OrderPaymentCaptcha } from "../components/order/OrderPaymentActions";
import {
  EMAIL_RE,
  formatIDR,
  getPaymentMethodFee,
  type ExpandedCategory,
  type PaymentMethodType,
} from "../components/order/constants";
import { useOrderCheckout } from "../hooks/useOrderCheckout";

const DRAFT_KEY = "loverse-order-draft";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface OrderDraft {
  formData: {
    groom_name: string;
    bride_name: string;
    wedding_date: string;
    whatsapp: string;
    email: string;
    template_slug: string;
  };
  paymentMethod: PaymentMethodType | null;
  savedAt: number;
}

function loadDraft(): OrderDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<OrderDraft>;
    if (!draft || typeof draft !== "object") return null;
    if (typeof draft.savedAt !== "number" || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    const f = draft.formData;
    if (!f || typeof f !== "object") return null;
    return {
      formData: {
        groom_name: typeof f.groom_name === "string" ? f.groom_name : "",
        bride_name: typeof f.bride_name === "string" ? f.bride_name : "",
        wedding_date: typeof f.wedding_date === "string" ? f.wedding_date : "",
        whatsapp: typeof f.whatsapp === "string" ? f.whatsapp : "",
        email: typeof f.email === "string" ? f.email : "",
        template_slug: typeof f.template_slug === "string" ? f.template_slug : "",
      },
      paymentMethod: typeof draft.paymentMethod === "string" ? (draft.paymentMethod as PaymentMethodType) : null,
      savedAt: draft.savedAt,
    };
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* abaikan */
  }
}

function OrderAside({
  template,
  image,
  paymentMethod,
  step,
}: {
  template: MasterTemplate;
  image?: string;
  paymentMethod: PaymentMethodType;
  step: 1 | 2 | 3;
}) {
  const { t } = useTranslation();
  const fee = step === 2 ? getPaymentMethodFee(template.price, paymentMethod) : 0;
  const perks = [t("order.asidePerkActive"), t("order.asidePerkRsvp"), t("order.asidePerkEdit")];

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-4">
        <div className="border border-ink-900/15 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow text-ink-400">{t("order.asideTitle")}</p>
            <span className="font-data text-[14px] text-ink-400">0{step} / 03</span>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="aspect-[3/4] w-[64px] shrink-0 overflow-hidden border border-ink-900/10 bg-cream-100">
              {image ? <img src={image} alt={template.name} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight tracking-[-0.03em] text-ink-950">{template.name}</p>
              <p className="mt-1 text-[14px] text-ink-400">{t("order.packageLabel")} {template.category}</p>
              <p className="mt-1.5 font-data text-[14px] text-ink-700">{formatIDR(template.price)}</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-ink-900/10 pt-3 text-[14px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-400">{t("order.templatePrice")}</span>
              <span className="font-data text-ink-700">{formatIDR(template.price)}</span>
            </div>
            {step === 2 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-400">{t("order.adminFee")}</span>
                <span className="font-data text-ink-700">{formatIDR(fee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[14px] font-semibold text-ink-950">{t("order.totalPayment")}</span>
              <span className="font-display text-xl tracking-[-0.03em] text-ink-950">{formatIDR(template.price + fee)}</span>
            </div>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-400">{t("order.asideLockedNote")}</p>
        </div>

        <div className="border border-ink-900/12 bg-cream-50 p-4">
          <ul className="space-y-2.5">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-600">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-600" />
                {perk}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 border-t border-ink-900/10 pt-3 text-[14px] text-ink-400">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-ember-600" />
            {t("order.secureDesc")}
          </div>
        </div>

        <Link
          to="/contact"
          className="flex items-center gap-3 border border-ink-900/12 bg-white p-3.5 transition-colors hover:border-ink-900/30 hover:bg-cream-50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink-950 text-peach-300">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-ink-900">{t("order.asideHelp")}</span>
            <span className="mt-0.5 block text-[14px] leading-snug text-ink-400">{t("order.asideHelpDesc")}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}

export default function OrderForm() {
  const { t } = useTranslation();
  usePageMeta(
    "Buat Undangan Pernikahan Digital — LoVerse",
    "Pilih 40+ tema undangan digital, isi data, bayar via QRIS, VA, e-wallet atau WhatsApp. Undangan aktif otomatis dengan PIN dashboard.",
  );
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showConfirm, setShowConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [draft] = useState<OrderDraft | null>(loadDraft);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(() => {
    const m = draft?.paymentMethod;
    return typeof m === "string" &&
      ["automatic", "qris", "gopay", "echannel", "bni_va", "bri_va", "permata_va", "cimb_va", "whatsapp"].includes(m)
      ? (m as PaymentMethodType)
      : "automatic";
  });
  const [expandedCategory, setExpandedCategory] = useState<ExpandedCategory | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);
  const [templateList, setTemplateList] = useState<MasterTemplate[]>(MASTER_TEMPLATES);

  useEffect(() => {
    let isMounted = true;
    const fetchTemplates = async () => {
      try {
        const { data: dbTemplates, error } = await supabase.from("templates").select("*").order("name", { ascending: true });
        if (!error && dbTemplates && dbTemplates.length > 0 && isMounted) {
          const combined = dbTemplates.map((dbItem) => {
            const local = MASTER_TEMPLATES.find((item) => item.slug === dbItem.slug);
            return {
              id: dbItem.id ?? (local ? local.id : 0),
              slug: dbItem.slug,
              name: dbItem.name,
              category: dbItem.category,
              price: Number(dbItem.price),
              image: local ? local.image : "https://r2.loverse.id/themes/botanical-gold.webp",
            };
          });
          setTemplateList(combined);
        }
      } catch (err) {
        console.warn("Gagal memuat harga template dari database:", err);
      }
    };
    fetchTemplates();
    return () => {
      isMounted = false;
    };
  }, []);

  const urlSlug = searchParams.get("template");
  const defaultTemplate =
    templateList.find((item) => item.slug === urlSlug) ||
    MASTER_TEMPLATES.find((item) => item.slug === urlSlug) ||
    templateList[0] ||
    MASTER_TEMPLATES[0];
  const urlTemplate =
    urlSlug && (templateList.some((item) => item.slug === urlSlug) || MASTER_TEMPLATES.some((item) => item.slug === urlSlug))
      ? urlSlug
      : null;
  const draftTemplate =
    draft?.formData.template_slug &&
    (templateList.some((item) => item.slug === draft.formData.template_slug) ||
      MASTER_TEMPLATES.some((item) => item.slug === draft.formData.template_slug))
      ? draft.formData.template_slug
      : null;

  const initialFormState = {
    groom_name: draft?.formData.groom_name ?? "",
    bride_name: draft?.formData.bride_name ?? "",
    wedding_date: draft?.formData.wedding_date ?? "",
    whatsapp: draft?.formData.whatsapp ?? "",
    email: draft?.formData.email ?? "",
    template_slug: urlTemplate ?? draftTemplate ?? defaultTemplate.slug,
  };

  const [formData, setFormData] = useState(initialFormState);
  const selectedTemplate = templateList.find((item) => item.slug === formData.template_slug) || defaultTemplate;
  const selectedImage =
    selectedTemplate?.image || MASTER_TEMPLATES.find((item) => item.slug === formData.template_slug)?.image;

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draftToSave: OrderDraft = { formData, paymentMethod, savedAt: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));
      } catch {
        /* abaikan */
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, paymentMethod]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleWhatsappChange = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.replace(/\D/g, "");
    if (value.startsWith("0")) value = value.substring(1);
    setFormData({ ...formData, whatsapp: value });
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const invalidateCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  const { loadingWA, loadingMidtrans, handleMidtransCheckout, handleWhatsappCheckout } = useOrderCheckout({
    formData,
    selectedTemplate,
    paymentMethod,
    captchaToken,
    invalidateCaptcha,
    clearDraft,
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const goNextFromData = () => {
    if (!formData.groom_name.trim() || !formData.bride_name.trim()) return toast.warning(t("validation.coupleRequired"));
    if (!formData.wedding_date) return toast.warning(t("validation.weddingDateRequired"));
    if (!formData.email.trim() || !EMAIL_RE.test(formData.email.trim())) return toast.warning(t("validation.emailInvalid"));
    if (!formData.whatsapp.trim() || formData.whatsapp.length < 8) return toast.warning(t("validation.whatsappInvalid"));
    setStep(2);
    scrollTop();
  };

  const goNextFromMethod = () => {
    setStep(3);
    scrollTop();
  };

  const goBackStep = () => {
    setStep((value) => (value > 1 ? ((value - 1) as 1 | 2 | 3) : value));
    scrollTop();
  };

  const handleReset = () => {
    setFormData({
      groom_name: "",
      bride_name: "",
      wedding_date: "",
      whatsapp: "",
      email: "",
      template_slug: defaultTemplate.slug,
    });
    setPaymentMethod("automatic");
    setExpandedCategory(null);
    setStep(1);
    invalidateCaptcha();
    setShowConfirm(false);
    clearDraft();
    toast.success(t("order.toastResetSuccess"));
    scrollTop();
  };

  const wizardStepLabels = [t("order.wizStep1"), t("order.wizStep2"), t("order.wizStep3")];
  const handleBack = () => (step > 1 ? goBackStep() : goBackOrHome(navigate));
  const contextualBackLabel = step > 1 ? t("order.backToStep", { step: wizardStepLabels[step - 2] }) : t("order.back");
  const nextAction = step === 1 ? goNextFromData : step === 2 ? goNextFromMethod : null;

  return (
    <div className="min-h-[70svh] w-full max-w-full overflow-x-hidden bg-cream-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-10 lg:px-10 lg:py-14">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ink-400 transition-colors hover:text-ink-900"
        >
          <ArrowLeft size={13} /> {step > 1 ? t("order.btnBack") : t("order.back")}
        </button>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-6 border-b border-ink-900/15 pb-7 sm:mt-9 sm:pb-9">
          <div className="min-w-0">
            <p className="eyebrow text-ember-600">Pemesanan / 2026</p>
            <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-[0.94] tracking-[-0.05em] text-ink-950">
              Pesan <span className="italic text-ember-600">undangan.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-500 sm:text-[14px]">
              {t("order.desc")}{" "}
              <Link to="/tutorial" className="inline-flex items-center gap-1 font-semibold text-ember-600 underline-offset-4 hover:underline">
                <GraduationCap size={13} /> {t("order.tutorialLink")}
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden font-data text-[14px] uppercase tracking-[0.06em] text-ink-400 sm:inline">Langkah 0{step} / 03</span>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-1.5 border border-ink-900/15 px-3 py-2 text-[14px] font-medium text-ink-500 transition-colors hover:border-danger-600/40 hover:text-danger-700"
              title={t("order.resetForm")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("order.resetForm")}
            </button>
          </div>
        </div>

        <OrderSteps current={step} />

        {step === 3 ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-ember-600">Terakhir</p>
                <h2 className="mt-2 font-display text-2xl tracking-[-0.03em] text-ink-950 sm:text-3xl">Periksa sebelum bayar.</h2>
              </div>
              <span className="hidden font-data text-[14px] uppercase tracking-[0.06em] text-ink-400 sm:block">Invoice / draft</span>
            </div>
            <OrderSummary
              formData={formData}
              selectedTemplate={selectedTemplate}
              selectedImage={selectedImage}
              paymentMethod={paymentMethod}
              onEdit={() => {
                setStep(1);
                scrollTop();
              }}
              onChangeMethod={() => {
                setStep(2);
                scrollTop();
              }}
              actions={
                <>
                  <OrderPaymentCaptcha setCaptchaToken={setCaptchaToken} turnstileRef={turnstileRef} />
                  <OrderPayButton
                    paymentMethod={paymentMethod}
                    captchaToken={captchaToken}
                    loadingWA={loadingWA}
                    loadingMidtrans={loadingMidtrans}
                    onMidtransCheckout={handleMidtransCheckout}
                    onWhatsappCheckout={handleWhatsappCheckout}
                  />
                  <p className="text-center text-[14px] leading-relaxed text-ink-400">
                    Dengan melanjutkan, kamu menyetujui{" "}
                    <Link to="/terms" className="underline underline-offset-2 hover:text-ember-600">Syarat & Ketentuan</Link> LoVerse.
                  </p>
                </>
              }
            />
          </div>
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_316px]">
            <div className="min-w-0">
              {step === 1 ? (
                <OrderDetailsForm
                  formData={formData}
                  selectedTemplate={selectedTemplate}
                  selectedImage={selectedImage}
                  todayStr={todayStr}
                  onChange={handleChange}
                  onWhatsappChange={handleWhatsappChange}
                  onChangeTemplate={() =>
                    navigate("/", { replace: true, state: { scrollToTemplate: selectedTemplate?.slug } })
                  }
                />
              ) : (
                <PaymentMethodPicker
                  basePrice={selectedTemplate.price}
                  paymentMethod={paymentMethod}
                  onSelect={setPaymentMethod}
                  expandedCategory={expandedCategory}
                  onExpand={setExpandedCategory}
                />
              )}

              {nextAction ? (
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                  <OrderBackButton
                    onClick={handleBack}
                    label={t("order.btnBack")}
                    ariaLabel={contextualBackLabel}
                    variant="block"
                  />
                  <button
                    type="button"
                    onClick={nextAction}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[2px] bg-ink-950 px-3 py-3.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-ember-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/40 sm:py-4 sm:text-base"
                  >
                    {t("order.btnNext")} <ArrowRight size={17} />
                  </button>
                </div>
              ) : null}
            </div>

            <OrderAside template={selectedTemplate} image={selectedImage} paymentMethod={paymentMethod} step={step} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title={t("order.resetDialogTitle")}
        message={t("order.resetDialogMsg")}
        isDanger={true}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
