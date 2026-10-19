// ============================================================
// src/pages/OrderPage.tsx
// ------------------------------------------------------------
// Halaman /order - form pemesanan multi-bagian: pilih template, isi data acara,
// pilih metode pembayaran, submit membuat pending order via Edge Function create-order.
// Dipakai di  : App.tsx
// Keterikatan : lib/constants, lib/supabaseClient, hooks/useOrderCheckout,
//               components/order/*, ConfirmDialog, GlobalToast
// ============================================================

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
import { ArrowLeft, ArrowRight, GraduationCap, RotateCcw } from "lucide-react";
import { OrderBackButton } from "../components/order/OrderBackButton";
import { OrderDetailsForm } from "../components/order/OrderDetailsForm";
import { OrderSteps } from "../components/order/OrderSteps";
import { PaymentMethodPicker } from "../components/order/PaymentMethodPicker";
import { OrderSummary } from "../components/order/OrderSummary";
import {
  OrderPayButton,
  OrderPaymentCaptcha,
} from "../components/order/OrderPaymentActions";
import {
  EMAIL_RE,
  type ExpandedCategory,
  type PaymentMethodType,
} from "../components/order/constants";
import { useOrderCheckout } from "../hooks/useOrderCheckout";

// --- DRAFT OTOMATIS (localStorage) ---
// Order expired/gagal → user tidak isi ulang dari nol: form + template +
// metode terakhir tersimpan otomatis dan dipulihkan saat buka /order lagi.
const DRAFT_KEY = "loverse-order-draft";
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

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
    /* abaikan — storage penuh/diblokir bukan error fatal */
  }
}

export default function OrderForm() {
  const { t } = useTranslation();
  usePageMeta(
    'Buat Undangan Pernikahan Digital — LoVerse',
    'Pilih 40+ tema undangan digital, isi data, bayar via QRIS, VA, e-wallet atau WhatsApp. Undangan aktif otomatis dengan PIN dashboard.',
  );
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showConfirm, setShowConfirm] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Draft tersimpan (sekali baca saat mount).
  const [draft] = useState<OrderDraft | null>(loadDraft);
  // Metode bayar dipilih di langkah 2 (default otomatis).
  // Draft lama yang menyimpan metode tak dikenal dinormalisasi.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(() => {
    const m = draft?.paymentMethod;
    return typeof m === "string" &&
      ["automatic", "qris", "gopay", "echannel", "bni_va", "bri_va", "permata_va", "cimb_va", "whatsapp"].includes(m)
      ? (m as PaymentMethodType)
      : "automatic";
  });
  const [expandedCategory, setExpandedCategory] =
    useState<ExpandedCategory | null>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const [templateList, setTemplateList] =
    useState<MasterTemplate[]>(MASTER_TEMPLATES);

  useEffect(() => {
    let isMounted = true;
    const fetchTemplates = async () => {
      try {
        const { data: dbTemplates, error } = await supabase
          .from("templates")
          .select("*")
          .order("name", { ascending: true });

        if (!error && dbTemplates && dbTemplates.length > 0 && isMounted) {
          const combined = dbTemplates.map((dbItem) => {
            const local = MASTER_TEMPLATES.find((t) => t.slug === dbItem.slug);
            return {
              id: dbItem.id ?? (local ? local.id : 0),
              slug: dbItem.slug,
              name: dbItem.name,
              category: dbItem.category,
              price: Number(dbItem.price),
              image: local
                ? local.image
                : "https://r2.loverse.id/themes/botanical-gold.webp",
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
    templateList.find((t) => t.slug === urlSlug) ||
    MASTER_TEMPLATES.find((t) => t.slug === urlSlug) ||
    templateList[0] ||
    MASTER_TEMPLATES[0];

  const urlTemplate =
    urlSlug &&
    (templateList.some((t) => t.slug === urlSlug) ||
      MASTER_TEMPLATES.some((t) => t.slug === urlSlug))
      ? urlSlug
      : null;
  const draftTemplate =
    draft?.formData.template_slug &&
    (templateList.some((t) => t.slug === draft.formData.template_slug) ||
      MASTER_TEMPLATES.some((t) => t.slug === draft.formData.template_slug))
      ? draft.formData.template_slug
      : null;

  const initialFormState = {
    groom_name: draft?.formData.groom_name ?? "",
    bride_name: draft?.formData.bride_name ?? "",
    wedding_date: draft?.formData.wedding_date ?? "",
    whatsapp: draft?.formData.whatsapp ?? "",
    email: draft?.formData.email ?? "",
    // Prioritas: ?template= di URL > draft > default.
    template_slug: urlTemplate ?? draftTemplate ?? defaultTemplate.slug,
  };

  const [formData, setFormData] = useState(initialFormState);
  const selectedTemplate =
    templateList.find((t) => t.slug === formData.template_slug) ||
    defaultTemplate;
  const selectedImage =
    selectedTemplate?.image ||
    MASTER_TEMPLATES.find((t) => t.slug === formData.template_slug)?.image;

  // Simpan draft otomatis (debounce) setiap form/metode berubah.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draftToSave: OrderDraft = {
          formData,
          paymentMethod,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));
      } catch {
        /* abaikan — storage penuh/diblokir bukan error fatal */
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, paymentMethod]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWhatsappChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("0")) val = val.substring(1);
    setFormData({ ...formData, whatsapp: val });
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const invalidateCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  const {
    loadingWA,
    loadingMidtrans,
    handleMidtransCheckout,
    handleWhatsappCheckout,
  } = useOrderCheckout({
    formData,
    selectedTemplate,
    paymentMethod,
    captchaToken,
    invalidateCaptcha,
    clearDraft,
  });

  // Wizard 3 langkah: 1 Data -> 2 Metode -> 3 Konfirmasi & Bayar.
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNextFromData = () => {
    if (!formData.groom_name.trim() || !formData.bride_name.trim()) {
      toast.warning(t("validation.coupleRequired"));
      return;
    }
    if (!formData.wedding_date) {
      toast.warning(t("validation.weddingDateRequired"));
      return;
    }
    if (!formData.email.trim() || !EMAIL_RE.test(formData.email.trim())) {
      toast.warning(t("validation.emailInvalid"));
      return;
    }
    if (!formData.whatsapp.trim() || formData.whatsapp.length < 8) {
      toast.warning(t("validation.whatsappInvalid"));
      return;
    }
    setStep(2);
    scrollTop();
  };

  const goNextFromMethod = () => {
    if (!paymentMethod) {
      toast.warning(t("validation.paymentMethodRequired"));
      return;
    }
    setStep(3);
    scrollTop();
  };

  const goBackStep = () => {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
    scrollTop();
  };

  // Reset formulir = kosongkan data + langsung fallback ke langkah 1
  // (halaman isi data). Captcha ikut dibatalkan & halaman di-scroll ke atas.
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

  // --- NAVIGASI WIZARD (tombol kembali & lanjut seragam di footer step) ---
  const wizardStepLabels = [
    t("order.wizStep1"),
    t("order.wizStep2"),
    t("order.wizStep3"),
  ];
  // Langkah 1 -> kembali ke katalog/halaman sebelumnya.
  // Langkah 2 & 3 -> kembali ke langkah sebelumnya di wizard.
  const handleBack = () => (step > 1 ? goBackStep() : goBackOrHome(navigate));
  const contextualBackLabel =
    step > 1
      ? t("order.backToStep", { step: wizardStepLabels[step - 2] })
      : t("order.back");
  const nextAction =
    step === 1 ? goNextFromData : step === 2 ? goNextFromMethod : null;
  // Langkah 1 & 2 memakai baris navigasi bawah: [Kembali] [Lanjut] sebaris.
  // Langkah 3 tidak punya baris sendiri - verifikasi captcha, tombol bayar,
  // dan tombol kembali menyatu di dalam kartu ringkasan (slot actions
  // OrderSummary), tersusun atas-bawah agar label panjang tetap utuh.

  return (
    <div className="min-h-screen bg-[#F1E8DC] font-sans w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-8 md:py-12 min-w-0">
        {/* --- HEADER --- */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6 min-w-0">
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-xs font-bold text-stone-400 hover:text-[#E59A59] transition"
            >
              <ArrowLeft size={13} />{" "}
              {step > 1 ? t("order.btnBack") : t("order.back")}
            </button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#712E1E] mt-1.5 sm:mt-2 truncate">
              {t("order.title")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm md:text-base text-stone-500">
              {t("order.desc")}{" "}
              <Link
                to="/tutorial"
                className="inline-flex items-center gap-1 font-bold text-[#B4693F] hover:text-[#712E1E] hover:underline transition"
              >
                <GraduationCap size={13} /> {t("order.tutorialLink")}
              </Link>
            </p>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-red-500 transition px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl hover:bg-red-50"
            title={t("order.resetForm")}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t("order.resetForm")}</span>
          </button>
        </div>

        {/* --- INDIKATOR PROGRES --- */}
        <OrderSteps current={step} />

        {/* --- STEP 1: DATA --- */}
        {step === 1 ? (
          <OrderDetailsForm
            formData={formData}
            selectedTemplate={selectedTemplate}
            selectedImage={selectedImage}
            todayStr={todayStr}
            onChange={handleChange}
            onWhatsappChange={handleWhatsappChange}
            // Bukan generic-back: arahkan eksplisit ke katalog pada posisi
            // kartu tema yang sedang dipilih (state dibaca HomePage).
            onChangeTemplate={() =>
              navigate('/', {
                replace: true,
                state: { scrollToTemplate: selectedTemplate?.slug },
              })
            }
          />
        ) : null}

        {/* --- STEP 2: METODE --- */}
        {step === 2 ? (
          <PaymentMethodPicker
            basePrice={selectedTemplate.price}
            paymentMethod={paymentMethod}
            onSelect={setPaymentMethod}
            expandedCategory={expandedCategory}
            onExpand={setExpandedCategory}
          />
        ) : null}

        {/* --- STEP 3: KONFIRMASI & BAYAR --- */}
        {step === 3 ? (
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
            // Semua elemen langkah 3 menyatu di dalam kartu, urut atas-bawah:
            // verifikasi captcha -> tombol bayar (tanpa tombol kembali).
            actions={
              <>
                <OrderPaymentCaptcha
                  setCaptchaToken={setCaptchaToken}
                  turnstileRef={turnstileRef}
                />
                <OrderPayButton
                  paymentMethod={paymentMethod}
                  captchaToken={captchaToken}
                  loadingWA={loadingWA}
                  loadingMidtrans={loadingMidtrans}
                  onMidtransCheckout={handleMidtransCheckout}
                  onWhatsappCheckout={handleWhatsappCheckout}
                />
              </>
            }
          />
        ) : null}

        {/* --- NAVIGASI BAWAH (langkah 1 & 2): [Kembali] [Lanjut] --- */}
        {nextAction ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
            <OrderBackButton
              onClick={handleBack}
              label={t("order.btnBack")}
              ariaLabel={contextualBackLabel}
              variant="block"
            />
            <button
              type="button"
              onClick={nextAction}
              className="w-full min-h-11 px-3 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base bg-[#712E1E] text-white hover:bg-[#8E3B27] active:scale-[0.99] transition shadow-lg shadow-[#712E1E]/25 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E59A59]/40"
            >
              {t("order.btnNext")} <ArrowRight size={18} />
            </button>
          </div>
        ) : null}
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
