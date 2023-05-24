import { EMPTY_OBJ, isObject } from "../share/index";
import { ShapeFlags } from "../share/shapeFlags";
import { effect } from "../src/reactivity/effect";
import { createComponentInstance, setupComponent } from "./componets";
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: {
  createElement: any;
  insert: any;
  patchProps: any;
}) {
  const { createElement, insert, patchProps: hostPatchProp } = options;

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
    patch(null, vnode, container, null);
  }
  // n1 老数据
  // n2 新数据
  function patch(
    n1: any,
    n2: any,
    container: { append: (arg0: Text) => void },
    parentComponent: undefined | null
  ) {
    // ShapeFlags
    // vnode => flag
    const { type, shapeFlag } = n2;
    // console.log(vnode, "vnode");

    // Fragment => 只渲染 所有的children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        // 处理组件
        // TODO 判断 vnode 是不是 elemnet
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPOENTS) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processFragment(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    mountChildren(n2, container, parentComponent);
  }

  function processText(
    n1: any,
    n2: { el?: any; children?: any },
    container: { append: (arg0: Text) => void }
  ) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processComponent(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    mountComponent(n2, container, parentComponent);
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
    effect(() => {
      if (!instance.isMounted) {
        console.log("init");
        const { proxy } = instance;
        // 虚拟节点树🌲
        // 存下来 好更新的时候对比
        const subTree = (instance.subTree = instance.render.call(proxy));
        // console.log(subTree, "subTree");
        patch(null, subTree, container, instance);
        // 这里的 subtree 即为 渲染完好的 h 信息
        initialVnode.el = subTree.el;
        // 这里说明已挂载
        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        // 把最新的subtree 存起来 下次更新对比
        const preSubTree = instance.subTree;
        instance.subTree = subTree;
        // console.log(subTree, preSubTree);
        console.log("update");
        patch(preSubTree, subTree, container, instance);
      }
    });
  }
  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any
  ) {
    if (!n1) {
      // init
      mountElement(n2, container, parentComponent);
    } else {
      // update
      patchElement(n1, n2, container);
    }
  }
  function patchElement(n1: any, n2: any, container: any) {
    console.log(n1);
    console.log(n2);
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    // 赋值给下一位
    const el = (n2.el = n1.el);
    patchProps(el, oldProps, newProps);
  }

  function patchProps(el, oldProps, newProps) {
    if (newProps !== oldProps) {
      for (const key in newProps) {
        const preProp = oldProps[key];
        const nextProp = newProps[key];
        if (preProp !== nextProp) {
          hostPatchProp(el, key, preProp, nextProp);
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
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
      patch(null, children, el, parentComponent);
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
        hostPatchProp(el, key, null, props[key]);
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
      patch(null, v, el, parentComponent);
    });
  }

  return {
    createApp: createAppApi(render),
  };
}
