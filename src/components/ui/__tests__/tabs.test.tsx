import { fireEvent, render, screen } from "@testing-library/react-native";

import { haptics } from "@/lib/haptics";

import { Tabs } from "../tabs";

jest.mock("@/lib/haptics", () => ({
  haptics: { selection: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

const OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "contacts", label: "Contacts" },
] as const;

beforeEach(() => {
  jest.mocked(haptics.selection).mockClear();
});

describe("Tabs", () => {
  it("selects a tab and plays a tick by default", () => {
    const onChange = jest.fn();
    render(<Tabs options={OPTIONS} value="saved" onChange={onChange} />);

    fireEvent.press(screen.getByText("Contacts"));

    expect(onChange).toHaveBeenCalledWith("contacts");
    expect(haptics.selection).toHaveBeenCalledTimes(1);
  });

  it("stays silent when haptics is turned off", () => {
    const onChange = jest.fn();
    render(<Tabs options={OPTIONS} value="saved" onChange={onChange} haptics={false} />);

    fireEvent.press(screen.getByText("Contacts"));

    expect(onChange).toHaveBeenCalledWith("contacts");
    expect(haptics.selection).not.toHaveBeenCalled();
  });

  it("does nothing when the selected tab is tapped again", () => {
    const onChange = jest.fn();
    render(<Tabs options={OPTIONS} value="saved" onChange={onChange} />);

    fireEvent.press(screen.getByText("Saved"));

    expect(onChange).not.toHaveBeenCalled();
    expect(haptics.selection).not.toHaveBeenCalled();
  });
});
