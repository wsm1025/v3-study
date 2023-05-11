import { effect, stop } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);
    // update
    user.age++;
    expect(nextAge).toBe(12);
  });

  it("should return runner when call effect", () => {
    // 1. effect(fn) =>function(runner)=>fn=>return
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
});

it("scheduler", () => {
  // effect 第二个参数 scheduler 的 fn
  // effect第一次执行还会执行fn
  // 响应对象 set（update） 更新时候 不会执行fn 而是执行 scheduler
  // 当执行 runner 时候，会再次执行fn
  let dummy;
  let run: any;
  const scheduler = jest.fn(() => {
    run = runner;
  });
  const obj = reactive({ foo: 1 });
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    { scheduler }
  );
  expect(scheduler).not.toHaveBeenCalled();
  expect(dummy).toBe(1);
  // should be called on first trigger
  obj.foo++;
  expect(scheduler).toHaveBeenCalledTimes(1);
  // // should not run yet
  expect(dummy).toBe(1);
  // // manually run
  run();
  // // should have run
  expect(dummy).toBe(2);
});

it("stop", () => {
  let dummy;
  const obj = reactive({ prop: 1 });
  const runner = effect(() => {
    dummy = obj.prop;
  });
  obj.prop = 2;
  expect(dummy).toBe(2);
  stop(runner);
  // obj.prop = 3;
  obj.prop++;
  expect(dummy).toBe(2);

  // stopped effect should still be manually callable
  runner();
  expect(dummy).toBe(3);
});
