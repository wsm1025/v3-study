import { isReadonly, shallowReadOnly } from "../reactive";

describe("shallowReadonly", () => {
  it("one deep", () => {
    // 只一层
    const props = shallowReadOnly({
      n: { foo: 1 },
    });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });
  it("warn when setter", () => {
    console.warn = jest.fn();
    const user = shallowReadOnly({ age: 11 });
    user.age = 12;
    expect(console.warn).toBeCalled();
  });
});
