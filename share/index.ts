export const isObject = (val) => {
  return val !== null && typeof val === "object";
};
export const extend = Object.assign;
export const hasChange = (newValue, oldValue) => !Object.is(newValue, oldValue);
export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);
