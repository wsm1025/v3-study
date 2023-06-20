export * from "./toDisplayString";
export const isObject = (val) => {
  return val !== null && typeof val === "object";
};
export const isString = (value) => typeof value === "string";

export const extend = Object.assign;
export const hasChange = (newValue, oldValue) => !Object.is(newValue, oldValue);
export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, r: string) => {
    return r ? r.toLocaleUpperCase() : "";
  });
};
export const capitalize = (str: string) => {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};
export const handlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};
export const EMPTY_OBJ = {};
