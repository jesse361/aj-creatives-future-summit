/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Countdown } from "@/components/countdown/Countdown";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("countdown display", () => {
  it("shows a clear message when no date is configured", () => {
    render(<Countdown startAt={null} endAt={null} timezone="UTC" datesConfirmed={false} />);
    expect(screen.getByText(/has not been set/i)).toBeTruthy();
    expect(screen.queryByText("00")).toBeNull();
  });

  it("shows an invalid date message instead of a timer", () => {
    render(<Countdown startAt="tomorrow" endAt={null} timezone="UTC" datesConfirmed={false} />);
    expect(screen.getByText(/invalid/i)).toBeTruthy();
  });

  it("ticks the seconds and clears the interval on unmount", () => {
    vi.useFakeTimers();
    const start = new Date(Date.now() + 125_000).toISOString();
    const end = new Date(Date.now() + 7200_000).toISOString();
    const clear = vi.spyOn(window, "clearInterval");
    const view = render(<Countdown startAt={start} endAt={end} timezone="UTC" datesConfirmed={false} />);
    vi.advanceTimersByTime(1000);
    expect(screen.getByText("Seconds")).toBeTruthy();
    view.unmount();
    expect(clear).toHaveBeenCalled();
  });
});
