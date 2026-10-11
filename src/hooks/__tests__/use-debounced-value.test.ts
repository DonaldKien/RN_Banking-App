import { act, renderHook } from "@testing-library/react-native";

import { useDebouncedValue } from "../use-debounced-value";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("only updates after the value has stopped changing for the delay", () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value, 200), {
      initialProps: { value: "" },
    });

    rerender({ value: "a" });
    act(() => jest.advanceTimersByTime(150));
    rerender({ value: "ai" }); // a new value restarts the wait
    act(() => jest.advanceTimersByTime(150));
    expect(result.current).toBe(""); // only 150 ms since the last change

    act(() => jest.advanceTimersByTime(50));
    expect(result.current).toBe("ai"); // 200 ms since the last change
  });

  it("starts with the initial value without waiting", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 200));
    expect(result.current).toBe("hello");
  });
});
