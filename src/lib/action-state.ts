/**
 * The shape every admin form action returns.
 *
 * Actions used to return void. The page revalidated, nothing on screen
 * changed, and an editor had no way to tell a successful save from a click
 * that never registered. One shared shape means every form can report itself
 * the same way without each screen inventing its own.
 */
export type ActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /**
   * Set on every result so two identical submissions are still distinct
   * objects. Without it React sees the same state after a second save and the
   * confirmation never reappears.
   */
  at?: number;
};

export const IDLE: ActionState = { status: "idle" };

export function ok(message: string): ActionState {
  return { status: "ok", message, at: Date.now() };
}

export function fail(message: string): ActionState {
  return { status: "error", message, at: Date.now() };
}
