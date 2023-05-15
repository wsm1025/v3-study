import { isObject } from "../share/index";
import { createComponentInstance, setupComponent } from "./componets";

export function render(vnode, container) {
  patch(vnode, container);
}
function patch(vnode, container) {
  console.log(vnode, "path");
  // 处理组件
  // TODO 判断 vnode 是不是 elemnet
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
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
  let { type, props, children } = vnode;
  // type
  const el = (vnode.el = document.createElement(type));
  // 内容
  console.log(children);
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(children, container);
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
