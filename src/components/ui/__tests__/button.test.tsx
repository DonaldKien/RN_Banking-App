import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { THROTTLE_MS } from "@/constants/debounce";
import { haptics } from "@/lib/haptics";

import { Button } from "../button";

jest.mock("@/lib/haptics", () => ({
  haptics: { selection: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.mocked(haptics.selection).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("Button", () => {
  it("is not throttled by default", () => {
    const onPress = jest.fn();
    render(<Button title="Review transfer" onPress={onPress} />);

    fireEvent.press(screen.getByText("Review transfer"));
    fireEvent.press(screen.getByText("Review transfer"));

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("ignores a double tap when throttled (for POST requests)", () => {
    const onPress = jest.fn();
    render(<Button title="Confirm" onPress={onPress} throttle />);

    fireEvent.press(screen.getByText("Confirm"));
    fireEvent.press(screen.getByText("Confirm"));

    expect(onPress).toHaveBeenCalledTimes(1);
    // Ignored taps don't buzz either.
    expect(haptics.selection).toHaveBeenCalledTimes(1);
  });

  it("accepts another tap once the throttle has passed", () => {
    const onPress = jest.fn();
    render(<Button title="Confirm" onPress={onPress} throttle />);

    fireEvent.press(screen.getByText("Confirm"));
    act(() => jest.advanceTimersByTime(THROTTLE_MS.press));
    fireEvent.press(screen.getByText("Confirm"));

    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
