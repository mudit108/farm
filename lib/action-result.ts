/**
 * Standard result for admin server actions.
 *
 * Most admin actions historically returned void, which meant the UI
 * could only ever say "done" — even when the action had silently
 * failed and logged to the server console. Actions converted to return
 * this can report the truth instead.
 */
export type ActionResult = {
  ok: boolean;
  message: string;
};

export function ok(message: string): ActionResult {
  return { ok: true, message };
}

export function fail(message: string): ActionResult {
  return { ok: false, message };
}
