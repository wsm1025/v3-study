import { isObject } from "../share/index";
import { ShapeFlags } from "../share/shapeFlags";
import { createComponentInstance, setupComponent } from "./componets";

export function render(vnode, container) {
  patch(vnode, container);
}
function patch(vnode, container) {
  // ShapeFlags
  // vnode => flag
  const { shapeFlag } = vnode;
  console.log(vnode, "path");
  // 处理组件
  // TODO 判断 vnode 是不是 elemnet
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPOENTS) {
    processComponent(vnode, container);
  }
}
function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(initialVnode, container) {
  const instance = createComponentInstance(initialVnode);
  setupComponent(instance);
  setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance: any, initialVnode, container: any) {
  const { proxy } = instance;
  // 虚拟节点树🌲
  const subTree = instance.render.call(proxy);
  console.log(subTree, "subTree");
  patch(subTree, container);
  // 这里的 subtree 即为 渲染完好的 h 信息
  initialVnode.el = subTree.el;
}
function processElement(vnode: any, container: any) {
  // init
  mountElement(vnode, container);
  // update
}
function mountElement(vnode: any, container: any) {
  let { type, props, children, shapeFlag } = vnode;
  // type
  const el = (vnode.el = document.createElement(type));
  // 内容
  console.log(children, "children");
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  } else if (isObject(children)) {
    patch(children, el);
  }
  // props
  if (props) {
    for (const key in props) {
      el.setAttribute(key, props[key]);
    }
  }
  container.appendChild(el);

  function mountChildren(children: Array<Element>, el) {
    children.forEach((v) => {
      patch(v, el);
    });
  }
}
