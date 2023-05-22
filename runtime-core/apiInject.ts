import { getCurrentInstance } from "./componets";

export function inject(key: any, defaultValue: () => any | any) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    const { parent } = currentInstance;
    const parentProvides = parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
export function provide(key: string | number, value: any) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides } = currentInstance;
    const parentProvides = currentInstance.parent.provides;
    //  改写原型 指向 且 这里只会执行一次

    console.log(provides, parentProvides);
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
