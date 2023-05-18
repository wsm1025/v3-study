import { ShapeFlags } from "../share/shapeFlags";

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    const slots = {} as any;
    for (const key in children) {
      const value = children[key];
      slots[key] = (props: any) => dealSlots(value(props));
    }
    instance.slots = slots;
  }
}

function dealSlots(value: any) {
  return Array.isArray(value) ? value : [value];
}
