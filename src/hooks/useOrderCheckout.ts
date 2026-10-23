// ============================================================
// src/hooks/useOrderCheckout.ts
// ------------------------------------------------------------
// Hook alur checkout halaman /order: validasi form, submit pending order
// via Edge Function create-order (Midtrans Snap) dan insert pending_orders
// untuk checkout manual WhatsApp.
// Dipakai di  : pages/OrderPage
// Keterikatan : lib/supabaseClient, lib/constants, components/GlobalToast,
//               components/order/constants
// ============================================================

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/GlobalToast";
import { useTranslation } from "../i18n";
import { ADMIN_WHATSAPP, type MasterTemplate } from "../lib/constants";
import { PRODUCTION_READY } from "../lib/constants";
import {
  EMAIL_RE,
  isValidWhatsappNumber,
  normalizeWhatsappNumber,
  type OrderFormData,
  type PaymentMethodType,
} from "../components/order/constants";

interface UseOrderCheckoutArgs {
  formData: OrderFormData;
  selectedTemplate: MasterTemplate;
  paymentMethod: PaymentMethodType | null;
  captchaToken: string | null;
  invalidateCaptcha: () => void;
  /** Hapus draft form tersimpan (dipanggil saat order berhasil dibuat). */
  clearDraft: () => void;
}

export function useOrderCheckout({
  formData,
  selectedTemplate,
  paymentMethod,
  captchaToken,
  invalidateCaptcha,
  clearDraft,
}: UseOrderCheckoutArgs) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [loadingWA, setLoadingWA] = useState(false);
  const [loadingMidtrans, setLoadingMidtrans] = useState(false);

  const validateInputs = () => {
    if (!formData.groom_name.trim() || !formData.bride_name.trim()) {
      toast.warning(t("validation.coupleRequired"));
      return false;
    }
    if (!formData.wedding_date) {
      toast.warning(t("validation.weddingDateRequired"));
      return false;
    }
    if (!formData.email.trim() || !EMAIL_RE.test(formData.email.trim())) {
      toast.warning(t("validation.emailInvalid"));
      return false;
    }
    if (!isValidWhatsappNumber(formData.whatsapp)) {
      toast.warning(t("validation.whatsappInvalid"));
      return false;
    }
    return true;
  };

  const handleMidtransCheckout = async () => {
    // Pertahanan lapis-2: UI menyembunyikan, tapi cegah juga pemanggilan langsung.
    if (!PRODUCTION_READY) {
      toast.warning(t("order.preLaunchNotice"));
      return;
    }
    if (!validateInputs()) return;
    if (!captchaToken) {
      toast.warning(t("common.captchaRequired"));
      return;
    }

    setLoadingMidtrans(true);
    const finalWhatsapp = `+62${normalizeWhatsappNumber(formData.whatsapp)}`;

    try {
      // Metode terpilih dikirim apa adanya; backend memetakan ke kanal
      // Snap yang sesuai akun + menolak bila pembayaran online dimatikan.
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          groom_name: formData.groom_name.trim(),
          bride_name: formData.bride_name.trim(),
          wedding_date: formData.wedding_date,
          whatsapp: finalWhatsapp,
          email: formData.email.trim().toLowerCase(),
          template_slug: formData.template_slug,
          payment_method: paymentMethod,
          captcha_token: captchaToken,
        },
      });

      if (error) {
        let errMessage = t("toast.orderCreateFailed", {
          error: "Unknown error",
        });
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const body = (await ctx.json()) as { error?: string };
            if (body?.error) errMessage = body.error;
          }
        } catch {
          /* fallback */
        }
        throw new Error(errMessage);
      }

      const payment = data as {
        success: boolean;
        order_id: string;
        order_token?: string;
        token?: string;
        redirect_url?: string;
      };

      if (!payment || !payment.order_id) {
        throw new Error(
          t("toast.orderCreateFailed", { error: "Gagal membuat invoice" }),
        );
      }

      // URL memakai token buram (order_token) agar id asli tidak bisa ditebak.
      // Fallback ke order_id mentah bila secret belum diset di server.
      const urlId = payment.order_token || payment.order_id;

      // Order tercatat di server — draft lokal sudah tidak diperlukan.
      clearDraft();

      if (
        payment.token &&
        typeof window.snap !== "undefined" &&
        window.snap?.pay
      ) {
        window.snap.pay(payment.token, {
          onSuccess: function (result: { order_id?: string }) {
            toast.success(t("toast.paymentSuccessPinSent"));
            navigate(
              `/payment-status?order_id=${result.order_id || payment.order_id}`,
            );
          },
          onPending: function (result: { order_id?: string }) {
            toast.warning(t("toast.paymentWaiting"));
            navigate(
              `/payment-status?order_id=${result.order_id || payment.order_id}`,
            );
          },
          onError: function () {
            toast.error(t("toast.paymentFailedRetry"));
          },
          onClose: function () {
            toast.warning(t("toast.paymentPopupClosed"));
            navigate(`/payment-status?order_id=${urlId}`);
          },
        });
      } else if (payment.redirect_url) {
        window.location.href = payment.redirect_url;
      } else {
        navigate(`/payment-status?order_id=${urlId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t("toast.systemError"));
      invalidateCaptcha();
    } finally {
      setLoadingMidtrans(false);
    }
  };

  const handleWhatsappCheckout = async () => {
    if (!validateInputs()) return;
    if (!captchaToken) {
      toast.warning(t("common.captchaRequired"));
      return;
    }

    setLoadingWA(true);

    try {
      const finalWhatsapp = `+62${normalizeWhatsappNumber(formData.whatsapp)}`;

      // Catat pending LEWAT edge function (validasi + Turnstile + rate
      // limit server-side). Insert langsung ke DB dari browser DILARANG
      // karena melewati semua pengaman (anti-spam/flood).
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          groom_name: formData.groom_name.trim(),
          bride_name: formData.bride_name.trim(),
          wedding_date: formData.wedding_date,
          whatsapp: finalWhatsapp,
          email: formData.email.trim().toLowerCase(),
          template_slug: formData.template_slug,
          payment_method: "manual_whatsapp",
          captcha_token: captchaToken,
        },
      });

      if (error) {
        let errMessage = t("toast.orderCreateFailed", { error: "Unknown error" });
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const body = (await ctx.json()) as { error?: string };
            if (body?.error) errMessage = body.error;
          }
        } catch {
          /* fallback */
        }
        invalidateCaptcha();
        throw new Error(errMessage);
      }

      if (!(data as { success?: boolean } | null)?.success) {
        invalidateCaptcha();
        throw new Error(t("toast.orderCreateFailed", { error: "Gagal membuat invoice" }));
      }

      // Pesanan manual tercatat — draft lokal sudah tidak diperlukan.
      clearDraft();

      const message = `Halo Admin, saya ingin memesan Undangan Digital:
        *Data Mempelai:*
        Pria: ${formData.groom_name}
        Wanita: ${formData.bride_name}
        Tanggal: ${formData.wedding_date}
        Email: ${formData.email}
        *Order:*
        Template: ${selectedTemplate.name}
        Total Harga: Rp ${selectedTemplate.price.toLocaleString("id-ID")}
        Mohon info cara pembayarannya.`;

      const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
      toast.success(t("toast.openingWhatsapp"));

      window.open(waUrl, "_blank");
      setTimeout(() => navigate("/order/success"), 1200);
    } catch (err) {
      console.error(err);
      toast.error(
        t("toast.orderCreateFailed", {
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      setLoadingWA(false);
    }
  };

  return {
    loadingWA,
    loadingMidtrans,
    handleMidtransCheckout,
    handleWhatsappCheckout,
  };
}
