import { proxyHandlers, readonlyHandlers } from "./baseHandlel.ts";
export function reactive(raw) {
  return createProxy(raw, proxyHandlers);
}

export const enum ReactiveFlags {
  IS_REACTIVE = "_v_isReactive",
  IS_READONLY = "_v_isReadonly",
}
export function isReactive(raw) {
  return !!raw[ReactiveFlags.IS_REACTIVE];
}
export function isReadonly(raw) {
  return !!raw[ReactiveFlags.IS_READONLY];
}
export function readonly(raw) {
  return createProxy(raw, readonlyHandlers);
}

function createProxy(raw: any, baseProxy) {
  return new Proxy(raw, baseProxy);
}
