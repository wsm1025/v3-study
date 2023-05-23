import { isObject } from "../share/index";
import { ShapeFlags } from "../share/shapeFlags";
import { createComponentInstance, setupComponent } from "./componets";
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: {
  createElement: any;
  insert: any;
  patchProps: any;
}) {
  const { createElement, insert, patchProps } = options;

  function render(
    vnode: {
      type: any;
      props: any;
      children: any;
      shapeFlag: ShapeFlags;
      el: null;
    },
    container: any
  ) {
    patch(vnode, container, null);
  }
  function patch(
    vnode: any,
    container: { append: (arg0: Text) => void },
    parentComponent: undefined | null
  ) {
    // ShapeFlags
    // vnode => flag
    const { type, shapeFlag } = vnode;
    // console.log(vnode, "vnode");

    // Fragment => 只渲染 所有的children
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        // 处理组件
        // TODO 判断 vnode 是不是 elemnet
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPOENTS) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  function processFragment(vnode: any, container: any, parentComponent: any) {
    mountChildren(vnode, container, parentComponent);
  }

  function processText(
    vnode: { el?: any; children?: any },
    container: { append: (arg0: Text) => void }
  ) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processComponent(vnode: any, container: any, parentComponent: any) {
    mountComponent(vnode, container, parentComponent);
  }

  function mountComponent(
    initialVnode: any,
    container: any,
    parentComponent: any
  ) {
    const instance = createComponentInstance(initialVnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
  }
  function setupRenderEffect(
    instance: any,
    initialVnode: { el: any },
    container: any
  ) {
    const { proxy } = instance;
    // 虚拟节点树🌲
    const subTree = instance.render.call(proxy);
    // console.log(subTree, "subTree");
    patch(subTree, container, instance);
    // 这里的 subtree 即为 渲染完好的 h 信息
    initialVnode.el = subTree.el;
  }
  function processElement(vnode: any, container: any, parentComponent: any) {
    // init
    mountElement(vnode, container, parentComponent);
    // update
  }
  function mountElement(vnode: any, container: any, parentComponent: any) {
    let { type, props, children, shapeFlag } = vnode;
    // type
    const el = (vnode.el = createElement(type));
    // 内容
    // console.log(children, "children");
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    } else if (isObject(children)) {
      patch(children, el, parentComponent);
    }
    // props
    if (props) {
      for (const key in props) {
        // const isOn = (key: string) => /^on[A-Z]/.test(key);
        // if (isOn(key)) {
        //   // on + event
        //   const event = key.slice(2).toLocaleLowerCase();
        //   el.addEventListener(event, props[key]);
        // } else {
        //   el.setAttribute(key, props[key]);
        // }
        patchProps(el, key, props);
      }
    }
    // container.appendChild(el);
    insert(el, container);
  }

  function mountChildren(
    vnode: { children: Element[] },
    el: any,
    parentComponent: any
  ) {
    vnode.children.forEach((v) => {
      patch(v, el, parentComponent);
    });
  }

  return {
    createApp: createAppApi(render),
  };
}
