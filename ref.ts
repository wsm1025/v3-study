import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChange, isObject } from "./share";
class RefImpl {
  private _value;
  private dep;
  private _rawValue: any;
  public _v_isRef = true;
  constructor(value: any) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    // 值改变了才会 去收集依赖
    if (hasChange(newValue, this._rawValue)) {
      // 先去修改 value
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}
export function ref(value) {
  return new RefImpl(value);
}
export function isRef(ref) {
  return !!ref._v_isRef;
}
export function unRef(ref) {
  // 先检查是否ref
  return isRef(ref) ? ref.value : ref;
}
export function proxyRefs(ref) {
  return new Proxy(ref, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      // set -> ref-> .value
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
}
