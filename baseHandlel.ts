import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";

const get = createGetter();
const set = createSetter();

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);
    if (!isReadonly) {
      // 在触发 get 的时候进行依赖收集
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const result = Reflect.set(target, key, value);
    // 在触发 set 的时候进行触发依赖
    trigger(target, key);
    return result;
  };
}

export const readonlyHandlers = {
  get: createGetter(true),
  set(target, key) {
    // readonly 的响应式对象不可以修改值
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};

export const proxyHandlers = {
  get,
  set,
};
