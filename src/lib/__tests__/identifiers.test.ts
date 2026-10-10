import { isValidAccountNumber, normaliseMalaysianMobile } from "../identifiers";

describe("normaliseMalaysianMobile", () => {
  it.each([
    ["012-345 6789", "60123456789"],
    ["+60 12-345 6789", "60123456789"],
    ["0111234 5678", "601112345678"],
    ["123456789", "60123456789"],
  ])("accepts %p", (input, expected) => {
    expect(normaliseMalaysianMobile(input)).toBe(expected);
  });

  it.each(["03-1234 5678", "0123", "+1 415 555 0100", ""])("rejects %p", (input) => {
    expect(normaliseMalaysianMobile(input)).toBeNull();
  });
});

describe("isValidAccountNumber", () => {
  it("requires 10–16 digits", () => {
    expect(isValidAccountNumber("123456789")).toBe(false);
    expect(isValidAccountNumber("1234567890")).toBe(true);
    expect(isValidAccountNumber("1234 5678 9012 3456")).toBe(true);
    expect(isValidAccountNumber("12345678901234567")).toBe(false);
  });
});
