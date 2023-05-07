class ReactiveEffect {
  private _fn;
  deps = [];
  active = true;
  constructor(fn: Function, public scheduler: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn();
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
}
const targetMap = new Map();
export function track(target, key) {
  // target-> key ->dep
  let depsMap = targetMap.get(key);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  if (activeEffect) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.scheduler ? effect.scheduler() : effect.run();
  }
}

let activeEffect: ReactiveEffect;

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
