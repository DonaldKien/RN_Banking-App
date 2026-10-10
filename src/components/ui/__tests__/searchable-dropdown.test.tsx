import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SearchableDropdown } from "../searchable-dropdown";

jest.mock("@/lib/haptics", () => ({
  haptics: { selection: jest.fn(), success: jest.fn(), error: jest.fn() },
}));

const BANKS = [
  { value: "MBB", label: "Maybank", description: "Malayan Banking Berhad" },
  { value: "CIMB", label: "CIMB", description: "CIMB Bank Berhad" },
  { value: "PBB", label: "Public Bank", description: "Public Bank Berhad" },
];

/** In the app, Expo Router provides safe-area insets; a standalone test must provide them. */
const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderDropdown = (props: Partial<Parameters<typeof SearchableDropdown>[0]> = {}) => {
  const onChange = jest.fn();
  const onBlur = jest.fn();
  render(
    <SafeAreaProvider initialMetrics={SAFE_AREA}>
      <SearchableDropdown
        testID="bank-dropdown"
        label="Bank"
        placeholder="Choose a bank"
        searchPlaceholder="Search bank name"
        options={BANKS}
        value=""
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
    </SafeAreaProvider>,
  );
  return { onChange, onBlur };
};

/** Types into the search box. */
const search = (text: string) => {
  fireEvent.changeText(screen.getByPlaceholderText("Search bank name"), text);
};

describe("SearchableDropdown", () => {
  it("shows the placeholder, or the selected option's label", () => {
    renderDropdown();
    expect(screen.getByText("Choose a bank")).toBeTruthy();

    screen.unmount();
    renderDropdown({ value: "CIMB" });
    expect(screen.getByText("CIMB")).toBeTruthy();
  });

  it("opens a list and selects an option", () => {
    const { onChange, onBlur } = renderDropdown();

    fireEvent.press(screen.getByTestId("bank-dropdown"));
    fireEvent.press(screen.getByLabelText("Public Bank, Public Bank Berhad"));

    expect(onChange).toHaveBeenCalledWith("PBB");
    // Closing counts as leaving the field, so form validation can run.
    expect(onBlur).toHaveBeenCalled();
  });

  it("searches the label and the description, case-insensitively", () => {
    renderDropdown();
    fireEvent.press(screen.getByTestId("bank-dropdown"));

    search("MALAYAN");

    expect(screen.getByText("Maybank")).toBeTruthy();
    expect(screen.queryByText("Public Bank")).toBeNull();
  });

  it("shows an empty state when nothing matches", () => {
    renderDropdown({ emptyMessage: "No bank matches your search." });
    fireEvent.press(screen.getByTestId("bank-dropdown"));

    search("zzz");

    expect(screen.getByText("No bank matches your search.")).toBeTruthy();
  });

  it("shows an error under the field", () => {
    renderDropdown({ error: "Choose a bank." });
    expect(screen.getByText("Choose a bank.")).toBeTruthy();
  });
});
