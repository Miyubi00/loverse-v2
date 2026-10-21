import { SHOWCASE_TEMPLATES } from "./showcaseTemplates";

export default function PhoneShowcaseFallback({ activeIndex = 0 }: { activeIndex?: number }) {
  const active = SHOWCASE_TEMPLATES[activeIndex];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-4 pb-16 pt-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 48%, color-mix(in srgb, var(--color-peach-300) 14%, transparent), transparent 62%)",
        }}
        aria-hidden="true"
      />
      <div
        className="relative h-full max-h-[440px] w-full max-w-[260px]"
        role="img"
        aria-label={`Pratinjau template ${active.name}`}
        data-showcase-fallback=""
      >
        {SHOWCASE_TEMPLATES.map((template, index) => {
          const offset = (index - activeIndex + SHOWCASE_TEMPLATES.length) % SHOWCASE_TEMPLATES.length;
          const signed = offset > SHOWCASE_TEMPLATES.length / 2 ? offset - SHOWCASE_TEMPLATES.length : offset;
          const distance = Math.abs(signed);
          const isActive = distance === 0;

          return (
            <div
              key={template.slug}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                zIndex: 20 - distance,
                opacity: distance > 2 ? 0 : 1,
                transform: `translate3d(${signed * 15}%, ${distance * 1.4}%, 0) rotate(${signed * 3.4}deg) scale(${
                  isActive ? 1 : 0.9
                })`,
                transition:
                  "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              aria-hidden={!isActive}
            >
              <div className="relative aspect-[512/1108] h-full overflow-hidden rounded-[2rem] border-[5px] border-ink-900 bg-ink-900 shadow-deep">
                <img
                  src={template.image}
                  alt=""
                  width={512}
                  height={1108}
                  draggable={false}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-x-6 top-2.5 mx-auto h-1 rounded-full bg-ink-950/70" />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute bottom-20 left-1/2 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-peach-300/40 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
