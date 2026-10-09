import { normaliseSearchText } from "../format";

describe("normaliseSearchText", () => {
  it.each([
    ["  Aisyah  ", "aisyah"],
    ["Aisyah Lim", "aisyah lim"],
    ["012-345 6789", "012-345 6789"],
    ["   ", ""],
    ["", ""],
  ])("%p → %p", (input, expected) => {
    expect(normaliseSearchText(input)).toBe(expected);
  });
});
