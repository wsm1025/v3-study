import { hasOwn } from "../share/index";

const publicPropertiesMap: any = {
  $el: (i: { vnode: { el: any } }) => i.vnode.el,
  $slots: (i: { slots: any }) => i.slots,
  $props: (i: { props: any }) => i.props,
};
export const publicInstanceHandler = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    // console.log(setupState, "setupState");
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    if (publicPropertiesMap[key]) {
      return publicPropertiesMap[key](instance);
    }
  },
};
