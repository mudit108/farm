"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare Turnstile "are you human" check. Renders nothing until
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so forms keep working exactly as
 * before in the meantime. The token is exposed both through `onToken` and
 * as a hidden `cf-turnstile-response` input for server-action forms.
 *
 * Tokens are single-use: remount this (change its `key`) after a failed
 * submit to get a fresh one.
 */
export function Turnstile({ onToken }: { onToken?: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const [token, setToken] = useState("");

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let widgetId: string | undefined;
    let cancelled = false;

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widgetId = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (t: string) => {
          setToken(t);
          onTokenRef.current?.(t);
        },
        "expired-callback": () => {
          setToken("");
          onTokenRef.current?.("");
        },
      });
    };

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return (
    <>
      <div ref={ref} className="min-h-[65px]" />
      <input type="hidden" name="cf-turnstile-response" value={token} />
    </>
  );
}

/**
 * Invisible trap field. Real people never see or fill it; simple bots
 * fill every input. A form that arrives with it filled is a bot.
 */
export function Honeypot() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Leave this empty
        <input type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
