import { act, renderHook } from "@testing-library/react-native";

import { THROTTLE_MS } from "@/constants/debounce";

import { toThrottleMs, useThrottledPress } from "../use-throttled-press";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("toThrottleMs", () => {
  it.each([
    [undefined, 0],
    [false, 0],
    [true, THROTTLE_MS.press],
    [1000, 1000],
    [0, 0],
    [-50, 0],
  ])("%p → %p ms", (input, expected) => {
    expect(toThrottleMs(input)).toBe(expected);
  });
});

describe("useThrottledPress", () => {
  it("has no throttle by default: every tap runs", () => {
    const onPress = jest.fn();
    const { result } = renderHook(() => useThrottledPress(onPress));

    result.current();
    result.current();
    result.current();

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it("runs the first tap immediately and ignores repeats for 250 ms", () => {
    expect(THROTTLE_MS.press).toBe(250);
    const onPress = jest.fn();
    const { result } = renderHook(() => useThrottledPress(onPress, THROTTLE_MS.press));

    result.current(); // accepted
    act(() => jest.advanceTimersByTime(100));
    result.current(); // 100 ms later: ignored
    act(() => jest.advanceTimersByTime(100));
    result.current(); // 200 ms after the accepted tap: still ignored
    expect(onPress).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(50));
    result.current(); // 250 ms after the accepted tap: accepted
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("drops ignored taps instead of running them later", () => {
    const onPress = jest.fn();
    const { result } = renderHook(() => useThrottledPress(onPress, THROTTLE_MS.press));

    result.current();
    result.current();
    act(() => jest.advanceTimersByTime(1000));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("passes arguments through", () => {
    const onPress = jest.fn();
    const { result } = renderHook(() => useThrottledPress((id: string) => onPress(id), THROTTLE_MS.press));

    result.current("txn_1");

    expect(onPress).toHaveBeenCalledWith("txn_1");
  });

  it("can be turned off with 0", () => {
    const onPress = jest.fn();
    const { result } = renderHook(() => useThrottledPress(onPress, 0));

    result.current();
    result.current();

    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
