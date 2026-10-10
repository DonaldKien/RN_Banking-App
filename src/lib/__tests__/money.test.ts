import { amountTextToSen, formatMoney, ringgit, sanitizeAmountInput, senToAmountText } from "../money";

describe("formatMoney", () => {
  it("formats sen with thousands separators and two decimals", () => {
    expect(formatMoney(123456789)).toBe("RM 1,234,567.89");
    expect(formatMoney(5)).toBe("RM 0.05");
    expect(formatMoney(0)).toBe("RM 0.00");
  });

  it("handles signs", () => {
    expect(formatMoney(-1050)).toBe("-RM 10.50");
    expect(formatMoney(1050, { signed: true })).toBe("+RM 10.50");
    expect(formatMoney(0, { signed: true })).toBe("RM 0.00");
  });
});

describe("sanitizeAmountInput", () => {
  it.each([
    ["12.345", "12.34"],
    ["0012", "12"],
    [".5", "0.5"],
    ["1.2.3", "1.23"],
    ["abc12", "12"],
    ["12,50", "12.50"],
    ["123456789", "1234567"],
    ["", ""],
  ])("%p → %p", (input, expected) => {
    expect(sanitizeAmountInput(input)).toBe(expected);
  });
});

describe("amountTextToSen", () => {
  it("converts without floating-point error", () => {
    expect(amountTextToSen("0.1")).toBe(10);
    expect(amountTextToSen("0.29")).toBe(29);
    expect(amountTextToSen("1234.5")).toBe(123450);
    expect(amountTextToSen("19.99")).toBe(1999);
  });

  it("returns null for incomplete input", () => {
    expect(amountTextToSen("")).toBeNull();
    expect(amountTextToSen(".")).toBeNull();
    expect(amountTextToSen("abc")).toBeNull();
  });
});

describe("senToAmountText", () => {
  it("round-trips with amountTextToSen", () => {
    for (const sen of [1, 50, 1250, 5000, 999999]) {
      expect(amountTextToSen(senToAmountText(sen))).toBe(sen);
    }
  });

  it("omits zero cents", () => {
    expect(senToAmountText(ringgit(50))).toBe("50");
    expect(senToAmountText(1205)).toBe("12.05");
  });
});
