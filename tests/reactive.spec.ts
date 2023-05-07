import { reactive, isReactive } from "../reactive";
describe("reactive", () => {
  it("happy path", () => {
    const org = { foo: 1 };
    const obsever = reactive(org);
    expect(obsever.org).not.toBe(org);
    expect(obsever.foo).toBe(1);
    expect(isReactive(obsever)).toBe(true);
    expect(isReactive(org)).toBe(false);
  });
});
