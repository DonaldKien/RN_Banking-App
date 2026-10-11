import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppPressable } from "../app-pressable";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("AppPressable", () => {
  it("behaves like Pressable by default: every tap counts", () => {
    const onPress = jest.fn();
    render(
      <AppPressable onPress={onPress}>
        <Text>Key 1</Text>
      </AppPressable>,
    );

    fireEvent.press(screen.getByText("Key 1"));
    fireEvent.press(screen.getByText("Key 1"));

    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("ignores a double tap when throttled", () => {
    const onPress = jest.fn();
    render(
      <AppPressable onPress={onPress} throttle>
        <Text>Reset</Text>
      </AppPressable>,
    );

    fireEvent.press(screen.getByText("Reset"));
    fireEvent.press(screen.getByText("Reset"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses a number as the cooldown in milliseconds", () => {
    const onPress = jest.fn();
    render(
      <AppPressable onPress={onPress} throttle={1000}>
        <Text>Confirm</Text>
      </AppPressable>,
    );

    fireEvent.press(screen.getByText("Confirm")); // accepted
    act(() => jest.advanceTimersByTime(500));
    fireEvent.press(screen.getByText("Confirm")); // 500 ms later: ignored
    expect(onPress).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(500));
    fireEvent.press(screen.getByText("Confirm")); // 1000 ms after the accepted tap: accepted
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("passes the press event through", () => {
    const onPress = jest.fn();
    render(
      <AppPressable onPress={onPress}>
        <Text>Row</Text>
      </AppPressable>,
    );

    fireEvent.press(screen.getByText("Row"), { nativeEvent: { pageX: 10 } });

    expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: { pageX: 10 } }));
  });
});
