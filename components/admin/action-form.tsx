"use client";

import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";

type Props = {
  /**
   * Either a converted action returning ActionResult (preferred — the
   * toast can then report real success or failure), or a legacy void
   * action, in which case `successMessage` is shown optimistically.
   */
  action: (formData: FormData) => Promise<ActionResult | void>;
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
  /** Clears the form's inputs after a successful submit. */
  resetOnSuccess?: boolean;
  /** Ask "are you sure?" first — for broadcasts and deletes that can't be undone. */
  confirmMessage?: string;
};

/**
 * Drop-in replacement for <form action={...}> in the admin panel that
 * surfaces the outcome as a toast. Server actions revalidate in place
 * without any visible change, so without this an admin has no way to
 * tell whether a click did anything.
 */
export function ActionForm({
  action,
  successMessage = "Done.",
  className,
  children,
  resetOnSuccess = false,
  confirmMessage,
}: Props) {
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          try {
            const result = await action(formData);
            if (result && typeof result === "object" && "ok" in result) {
              show(result.message, result.ok);
              if (result.ok && resetOnSuccess) form.reset();
            } else {
              // Legacy void action — it revalidated without throwing,
              // which is the most we can honestly claim.
              show(successMessage, true);
              if (resetOnSuccess) form.reset();
            }
          } catch {
            show("Something went wrong. Please try again.", false);
          }
        });
      }}
      aria-busy={pending}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
