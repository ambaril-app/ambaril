export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string; code?: string };

export type ActionState = ActionResult<void>;
