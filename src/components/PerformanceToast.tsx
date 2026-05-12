/**
 * PerformanceToast — lightweight notification for performance events.
 *
 * Renders a brief, auto-dismissing toast when:
 * - 3D quality has been reduced (FPS sustained below threshold).
 * - The app has auto-switched to 2D mode after sustained low FPS.
 * - The user is on 3D mode with prefers-reduced-motion enabled.
 *
 * The `message` prop controls visibility: a non-null string shows the toast,
 * null hides it. The caller is responsible for clearing the message after
 * `AUTO_DISMISS_MS` (exported so callers can synchronise their timers).
 *
 * ## Accessibility
 * - `role="status"` + `aria-live="polite"` so screen readers announce the
 *   message without interrupting the user's current focus.
 * - The dismiss button has an accessible label.
 */
import { useEffect, useRef } from "react";

export const AUTO_DISMISS_MS = 5000;

export interface PerformanceToastProps {
  /** The message to display. Set to null to hide the toast. */
  readonly message: string | null;
  /** Called when the toast is dismissed (auto or manual). */
  readonly onDismiss: () => void;
}

export function PerformanceToast({
  message,
  onDismiss,
}: PerformanceToastProps): React.ReactElement | null {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message === null) return;

    // Clear any existing timer before starting a new one
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [message, onDismiss]);

  if (message === null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="performance-toast"
      style={{
        position: "absolute",
        top: "0.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        background: "rgba(0,0,0,0.75)",
        color: "#f9f6f2",
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        fontSize: "0.85rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        maxWidth: "320px",
        textAlign: "center",
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontSize: "1rem",
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
