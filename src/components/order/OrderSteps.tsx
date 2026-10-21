import { Check } from "lucide-react";
import { useTranslation } from "../../i18n";

interface OrderStepsProps {
  current: 1 | 2 | 3;
}

export function OrderSteps({ current }: OrderStepsProps) {
  const { t } = useTranslation();
  const steps = [t("order.wizStep1"), t("order.wizStep2"), t("order.wizStep3")];

  return (
    <ol className="mb-7 flex items-start gap-0 border-y border-ink-900/12 py-3 sm:mb-9" aria-label="Progres pemesanan">
      {steps.map((label, index) => {
        const stepNo = (index + 1) as 1 | 2 | 3;
        const isDone = stepNo < current;
        const isCurrent = stepNo === current;

        return (
          <li
            key={stepNo}
            className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
            aria-current={isCurrent ? "step" : undefined}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors sm:h-8 sm:w-8 ${
                isDone
                  ? "border-ink-950 bg-ink-950 text-cream-50"
                  : isCurrent
                    ? "border-ember-600 bg-ember-600 text-cream-50"
                    : "border-ink-900/20 bg-transparent text-ink-400"
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : `0${stepNo}`}
            </span>
            <span
              className={`truncate text-[14px] font-semibold leading-tight sm:text-[14px] ${
                isDone ? "text-ink-700" : isCurrent ? "text-ink-950" : "text-ink-400"
              }`}
            >
              {label}
            </span>
            {index < steps.length - 1 ? (
              <span className={`mx-1 h-px flex-1 sm:mx-2 ${isDone ? "bg-ink-900/35" : "bg-ink-900/12"}`} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
