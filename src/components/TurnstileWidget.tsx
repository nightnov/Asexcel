"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          size?: "normal" | "invisible" | "compact";
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

/**
 * Renders Cloudflare Turnstile in invisible mode. `onVerify` fires with a
 * fresh token whenever the challenge (silently) passes; the token is sent
 * along with chat/upload requests and re-checked server-side.
 */
export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetId.current || !window.turnstile) return;

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      size: "invisible",
      callback: onVerify,
      "expired-callback": onExpire,
    });
  }, [siteKey, onVerify, onExpire]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (containerRef.current && window.turnstile && !widgetId.current) {
            widgetId.current = window.turnstile.render(containerRef.current, {
              sitekey: siteKey,
              size: "invisible",
              callback: onVerify,
              "expired-callback": onExpire,
            });
          }
        }}
      />
      <div ref={containerRef} />
    </>
  );
}
