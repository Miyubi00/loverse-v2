import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'auto' | 'light' | 'dark';
          size?: 'normal' | 'compact' | 'flexible';
          appearance?: 'always' | 'execute' | 'interaction-only';
          language?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey?: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'auto' | 'light' | 'dark';
  appearance?: 'always' | 'execute' | 'interaction-only';
  className?: string;
}

const DEFAULT_SITE_KEY =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ||
  '0x4AAAAAAEcRn_gt6xClQCuS';

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget(
    {
      siteKey = DEFAULT_SITE_KEY,
      onSuccess,
      onError,
      onExpire,
      theme = 'light',
      appearance = 'interaction-only',
      className = '',
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Keep callbacks reference-stable to avoid tearing down the widget on parent state updates
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
      onSuccessRef.current = onSuccess;
      onErrorRef.current = onError;
      onExpireRef.current = onExpire;
    }, [onSuccess, onError, onExpire]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      let isMounted = true;

      const renderWidget = () => {
        if (!containerRef.current || !window.turnstile || widgetIdRef.current !== null) return;

        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size: 'flexible',
            appearance,
            callback: (token: string) => {
              if (isMounted && onSuccessRef.current) {
                onSuccessRef.current(token);
              }
            },
            'error-callback': () => {
              if (isMounted && onErrorRef.current) {
                onErrorRef.current();
              }
            },
            'expired-callback': () => {
              if (isMounted && onExpireRef.current) {
                onExpireRef.current();
              }
            },
          });
        } catch (err) {
          console.error('[Turnstile] Render error:', err);
        }
      };

      // Check if script is already present
      const scriptId = 'cf-turnstile-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        document.head.appendChild(script);
      } else if (window.turnstile) {
        renderWidget();
      } else {
        script.addEventListener('load', () => {
          if (isMounted) renderWidget();
        });
      }

      return () => {
        isMounted = false;
        if (window.turnstile && widgetIdRef.current !== null) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore unmount cleanup error
          }
          widgetIdRef.current = null;
        }
      };
    }, [siteKey, theme, appearance]);

    return (
      <div className={`flex w-full items-center justify-center ${className}`}>
        <div ref={containerRef} className="flex w-full max-w-[300px] items-center justify-center" />
      </div>
    );
  }
);

export default TurnstileWidget;
