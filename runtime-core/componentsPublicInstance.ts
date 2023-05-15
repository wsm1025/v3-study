const publicPropertiesMap: any = {
  $el: (i: { vnode: { el: any } }) => i.vnode.el,
};
export const publicInstanceHandler = {
  get({ _: instance }, key) {
    const { setupState } = instance;
    console.log(setupState, "setupState");
    if (key in setupState) {
      return setupState[key];
    }
    if (publicPropertiesMap[key]) {
      return publicPropertiesMap[key](instance);
    }
  },
};
