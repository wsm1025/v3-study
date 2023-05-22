import { isObject } from "../share/index";
import { ShapeFlags } from "../share/shapeFlags";
import { createComponentInstance, setupComponent } from "./componets";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  patch(vnode, container);
}
function patch(vnode, container) {
  // ShapeFlags
  // vnode => flag
  const { type, shapeFlag } = vnode;
  console.log(vnode, "vnode");

  // Fragment => 只渲染 所有的children
  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      // 处理组件
      // TODO 判断 vnode 是不是 elemnet
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPOENTS) {
        processComponent(vnode, container);
      }
      break;
  }
}

function processFragment(vnode: any, container: any) {
  mountChildren(vnode, container);
}

function processText(
  vnode: { el?: any; children?: any },
  container: { append: (arg0: Text) => void }
) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
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
    mountChildren(vnode, el);
  } else if (isObject(children)) {
    patch(children, el);
  }
  // props
  if (props) {
    for (const key in props) {
      const isOn = (key: string) => /^on[A-Z]/.test(key);
      if (isOn(key)) {
        // on + event
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, props[key]);
      } else {
        el.setAttribute(key, props[key]);
      }
    }
  }
  container.appendChild(el);
}

function mountChildren(vnode: { children: Element[] }, el: any) {
  vnode.children.forEach((v) => {
    patch(v, el);
  });
}
