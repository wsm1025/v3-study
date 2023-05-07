import { reactive, isReactive, isProxy } from "../reactive";
describe("reactive", () => {
  it("happy path", () => {
    const org = { foo: 1 };
    const obsever = reactive(org);
    expect(obsever.org).not.toBe(org);
    expect(obsever.foo).toBe(1);
    expect(isReactive(obsever)).toBe(true);
    expect(isReactive(org)).toBe(false);
    expect(isProxy(obsever)).toBe(true);
  });
  it("nested reactive", () => {
    const org = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const obe = reactive(org);
    expect(isReactive(obe.nested)).toBe(true);
    expect(isReactive(obe.array)).toBe(true);
    expect(isReactive(obe.array[0])).toBe(true);
  });
});
