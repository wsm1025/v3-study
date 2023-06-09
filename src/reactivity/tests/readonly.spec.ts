import { readonly, isReadonly, isProxy } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const res = { foo: 1, bar: { baz: 2 } };
    const wrapp = readonly(res);
    expect(wrapp).not.toBe(res);
    expect(wrapp.foo).toBe(1);
    expect(isReadonly(wrapp)).toBe(true);
    expect(isReadonly(res)).toBe(false);
    expect(isReadonly(wrapp.bar)).toBe(true);
    expect(isReadonly(res.bar)).toBe(false);
    expect(isProxy(wrapp)).toBe(true);
  });
  it("warn when setter", () => {
    console.warn = jest.fn();
    const user = readonly({ age: 11 });
    user.age = 12;
    expect(console.warn).toBeCalled();
  });
});
