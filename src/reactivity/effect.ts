let activeEffect: ReactiveEffect;
let shouldTrack: Boolean;
export class ReactiveEffect {
  private _fn;
  deps = [];
  active = true;
  constructor(fn: Function, public scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 这里会收集依赖 来自effect方法
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    activeEffect = this;
    const res = this._fn();
    // reset
    shouldTrack = false;
    return res;
  }
  stop() {
    if (this.active) {
      cleanEffect(this);
      this.active = false;
    }
  }
}
function cleanEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}
const targetMap = new Map();

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
export function track(target, key) {
  if (!isTracking()) {
    return;
  }
  // target-> key ->dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) return;
  let dep = depsMap.get(key);
  console.log(dep, "dep");
  if (!dep) {
    console.log(key, "key");
    dep = new Map();
    depsMap.set(key, dep);
  }
  triggerEffects(dep);
}
export function triggerEffects(dep) {
  for (const effect of dep) {
    effect.scheduler ? effect.scheduler() : effect.run();
  }
}
export function effect(fn: Function, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
