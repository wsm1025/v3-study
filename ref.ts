import { isTracking, trackEffects, triggerEffects } from "./effect";
import { hasChange } from "./share";
class RefImpl {
  private _value;
  public dep;
  constructor(value: any) {
    this._value = value;
    this.dep = new Set();
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(value) {
    // 值改变了才会 去收集依赖
    if (hasChange(value, this._value)) {
      // 先去修改 value
      this._value = value;
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}
export function ref(value) {
  return new RefImpl(value);
}
