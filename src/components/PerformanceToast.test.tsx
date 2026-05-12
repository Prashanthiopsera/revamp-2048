/**
 * Tests for PerformanceToast component (WO-026)
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PerformanceToast, AUTO_DISMISS_MS } from "./PerformanceToast.js";

describe("PerformanceToast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when message is null", () => {
    render(<PerformanceToast message={null} onDismiss={vi.fn()} />);
    expect(screen.queryByTestId("performance-toast")).toBeNull();
  });

  it("renders the toast with the provided message", () => {
    render(<PerformanceToast message="Quality reduced" onDismiss={vi.fn()} />);
    const toast = screen.getByTestId("performance-toast");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("Quality reduced");
  });

  it("has role=status and aria-live=polite for screen reader announcements", () => {
    render(<PerformanceToast message="Hello" onDismiss={vi.fn()} />);
    const toast = screen.getByRole("status");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<PerformanceToast message="Click me" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it(`auto-dismisses after ${String(AUTO_DISMISS_MS)}ms`, () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<PerformanceToast message="Auto dismiss" onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not auto-dismiss before the timeout", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<PerformanceToast message="Not yet" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS - 1);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("resets the auto-dismiss timer when a new message arrives", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { rerender } = render(
      <PerformanceToast message="First" onDismiss={onDismiss} />,
    );
    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS - 500);
    });
    // New message should restart the timer
    rerender(<PerformanceToast message="Second" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // 500ms into the new message's timer — should not have fired yet
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS - 500);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("hides when message changes from a string to null", () => {
    const { rerender } = render(
      <PerformanceToast message="Visible" onDismiss={vi.fn()} />,
    );
    expect(screen.getByTestId("performance-toast")).toBeInTheDocument();
    rerender(<PerformanceToast message={null} onDismiss={vi.fn()} />);
    expect(screen.queryByTestId("performance-toast")).toBeNull();
  });
});
