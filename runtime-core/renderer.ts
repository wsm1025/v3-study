import { EMPTY_OBJ, isObject } from "../share/index";
import { ShapeFlags } from "../share/shapeFlags";
import { effect } from "../src/reactivity/effect";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { createComponentInstance, setupComponent } from "./componets";
import { createAppApi } from "./createApp";
import { queueJobs } from "./scheduler";
import { Fragment, Text } from "./vnode";

export function createRenderer(options: {
  createElement: Function;
  insert: Function;
  patchProps: Function;
  remove: Function;
  setElementText: Function;
}) {
  const {
    createElement,
    insert: hostInsert,
    patchProps: hostPatchProp,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

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
    patch(null, vnode, container, null, null);
  }
  // n1 老数据
  // n2 新数据
  function patch(
    n1: any,
    n2: any,
    container: { append: (arg0: Text) => void },
    parentComponent: undefined | null,
    anchor: null | undefined
  ) {
    // ShapeFlags
    // vnode => flag
    const { type, shapeFlag } = n2;
    // console.log(vnode, "vnode");

    // Fragment => 只渲染 所有的children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        // 处理组件
        // TODO 判断 vnode 是不是 elemnet
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPOENTS) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processFragment(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
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
    parentComponent: any,
    anchor: null | undefined
  ) {
    // 创建组件
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    // 是否需要更新
    if (shouldUpdateComponent(n1, n2)) {
      // next 存储 下次需要更新的虚拟节点
      instance.next = n2;
      console.log("组件更新");
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
      console.log("组件不需要更新");
    }
  }

  function mountComponent(
    initialVnode: any,
    container: any,
    parentComponent: any,
    anchor: null | undefined
  ) {
    const instance = (initialVnode.component = createComponentInstance(
      initialVnode,
      parentComponent
    ));
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container, anchor);
  }
  function setupRenderEffect(
    instance: any,
    initialVnode: { el: any },
    container: any,
    anchor: null | undefined
  ) {
    // effect 返回值是一个 runner 可以 再次调用他 执行 他传递的函数 所以 在instance 上 挂载 所需要的更新函数
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          console.log("init");
          const { proxy } = instance;
          // 虚拟节点树🌲
          // 存下来 好更新的时候对比
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ));
          // console.log(subTree, "subTree");
          patch(null, subTree, container, instance, anchor);
          // 这里的 subtree 即为 渲染完好的 h 信息
          initialVnode.el = subTree.el;
          // 这里说明已挂载
          instance.isMounted = true;
        } else {
          console.log("update");
          const { next, proxy, vnode } = instance;
          // 需要更新组件的 props
          if (next) {
            // 更新 el
            next.el = vnode.el;
            // 更新相关属性
            updateComponentPreRender(instance, next);
          }
          const subTree = instance.render.call(proxy, proxy);
          // 把最新的subtree 存起来 下次更新对比
          const preSubTree = instance.subTree;
          instance.subTree = subTree;
          // console.log(subTree, preSubTree);
          patch(preSubTree, subTree, container, instance, anchor);
        }
      },
      {
        // 处理优化组件更新
        scheduler() {
          console.log("update-scheduler");
          queueJobs(instance.update);
        },
      }
    );
  }
  function processElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    if (!n1) {
      // init
      mountElement(n2, container, parentComponent, anchor);
    } else {
      // update
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }
  function patchElement(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    // 赋值给下一位
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(
    n1: any,
    n2: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    const preShapeFlag = n1.shapeFlag;
    const { shapeFlag } = n2;
    const c1 = n1.children;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 把老的 children 清除
        unmountedChildren(n1.children);
        // 2. 设置新的 text
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      // array
      if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // arrary diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }
  function patchKeyedChildren(
    c1: string | any[],
    c2: string | any[],
    container: { append: (arg0: Text) => void },
    parentComponent: null | undefined,
    parentAnchor: null | undefined
  ) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSameVNodeType(
      n1: { type: any; key: any },
      n2: { type: any; key: any }
    ): Boolean {
      // type
      // key
      return n1.type === n2.type && n1.key === n2.key;
    }
    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 新的比老的多
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间对比
      let s1 = i;
      let s2 = i;
      const toBePatch = e2 - s2 + 1;
      let patched = 0;
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatch);

      // 优化最长子序列
      let moved = false;
      let maxNewIndexSoFar = 0;
      // 初始化映射表
      for (let i = 0; i < toBePatch; i++) newIndexToOldIndexMap[i] = 0;
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (patched >= toBePatch) {
          // 新数据 已经全部处理过了 那老数据 没有的部分 直接全部 delete
          hostRemove(prevChild.el);
          continue;
        }
        // null undefined
        let newIndex;
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j < e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === undefined) {
          // 没查到 delete
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;
      // 采取倒叙操作
      for (let i = toBePatch - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          // 老的里面不存在 新的里面存在 需要 新增
          patch(null, nextChild, container, parentComponent, anchor);
          console.log("创建新节点", nextChild.el);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            console.log("移动位置", nextChild.el);
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function unmountedChildren(children: any[]) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      // remove
      hostRemove(el);
    }
  }

  function patchProps(
    el: any,
    oldProps: { [x: string]: any },
    newProps: { [x: string]: any }
  ) {
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
  function mountElement(
    vnode: any,
    container: any,
    parentComponent: any,
    anchor: any
  ) {
    let { type, props, children, shapeFlag } = vnode;
    // type
    const el = (vnode.el = createElement(type));
    // 内容
    // console.log(children, "children");
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent, anchor);
    } else if (isObject(children)) {
      patch(null, children, el, parentComponent, null);
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
    hostInsert(el, container, anchor);
  }

  function mountChildren(
    children: Array<any>,
    el: any,
    parentComponent: any,
    anchor: any
  ) {
    children.forEach((v) => {
      patch(null, v, el, parentComponent, anchor);
    });
  }

  return {
    createApp: createAppApi(render),
  };
}

function updateComponentPreRender(instance, nextVnode) {
  instance.vnode = nextVnode;
  instance.next = null;
  instance.props = nextVnode.props;
}
function getSequence(arr: number[]) {
  const len = arr.length;
  const min_arr = [0]; // 存储最小的索引，以索引0为基准
  const prev_arr = arr.slice(); // 储存前面的索引，slice为浅复制一个新的数组
  let last_index;
  let start;
  let end;
  let middle;
  for (let i = 0; i < len; i++) {
    let arrI = arr[i];
    // 1. 如果当前n比min_arr最后一项大
    last_index = min_arr[min_arr.length - 1];
    if (arr[last_index] < arrI) {
      min_arr.push(i);
      prev_arr[i] = last_index; // 前面的索引
      continue;
    }
    // 2. 如果当前n比min_arr最后一项小（二分类查找）
    start = 0;
    end = min_arr.length - 1;
    while (start < end) {
      middle = (start + end) >> 1; // 相当于Math.floor((start + end)/2)
      if (arr[min_arr[middle]] < arrI) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    if (arr[min_arr[end]] > arrI) {
      min_arr[end] = i;
      if (end > 0) {
        prev_arr[i] = min_arr[end - 1]; // 前面的索引
      }
    }
  }

  // 从最后一项往前查找
  let result = [];
  let i = min_arr.length;
  let last = min_arr[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = prev_arr[last];
  }

  return result;
}
