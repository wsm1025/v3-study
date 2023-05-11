import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _getter: Function;
  private _dirty: Boolean = true;
  private _value: any;
  private _effect: ReactiveEffect;
  constructor(getter: any) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      !this._dirty && (this._dirty = true);
    });
  }
  get value() {
    // _dirty 改变 的实际时机当响应式对象发生改变的时候
    // effect
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}
export function computed(getter) {
  return new ComputedRefImpl(getter);
}
