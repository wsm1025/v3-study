import { ShapeFlags } from "../share/shapeFlags";

export function createVnode(type, props?, children?) {
  const vnode = {
    type,
    props: props ?? {},
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
  };
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  return vnode;
}
function getShapeFlag(type: any) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPOENTS;
}
