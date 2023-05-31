import { ShapeFlags } from "../share/shapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVnode(type, props?, children?) {
  const vnode = {
    type,
    props: props ?? {},
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
    key: props?.key,
  };
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }
  //组件类型 +  children object ==>slot
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPOENTS) {
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

export function creteTextVnode(text: string) {
  return createVnode(Text, {}, text);
}

function getShapeFlag(type: any) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPOENTS;
}
