import { proxyRefs } from "../src";
import { shallowReadOnly } from "../src/reactivity/reactive";
import { emit } from "./componentsEmit";
import { initProps } from "./componentsProps";
import { publicInstanceHandler } from "./componentsPublicInstance";
import { initSlots } from "./componentsSlots";
type instanceType = {
  vnode: any;
  type: any;
  setupState: {};
  props: {};
  emit: () => void;
  slots: {};
  provides: {};
  parent: any;
  proxy?: any;
  isMounted: boolean;
  subTree: {};
  n2: null;
};

export function createComponentInstance(vnode: { type: any }, parent: any) {
  console.log("createComponentInstance", parent);
  const component: instanceType = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    subTree: {},
    isMounted: false,
    // 下次需要更新的虚拟节点
    n2: null,
  };
  // 第一个参数 为 null 不改变 this 那么 emit 函数的 第一个参数即为instance 用户再传第二个参数
  // 这里 instance 即为 父组件
  // console.log(vnode, "component");
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance: instanceType) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance: instanceType) {
  // console.log(instance, "instance");
  const Component = instance.type;
  // ctx
  instance.proxy = new Proxy({ _: instance }, publicInstanceHandler);
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);
    // 在这里把 setup 的数据 获取到
    const setupRes = setup(shallowReadOnly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupRes);
  }
}
function handleSetupResult(instance: instanceType, setupRes: any) {
  // function object
  // TODO function
  if (typeof setupRes === "object") {
    // 在这里把 setup 的数据 挂载在 setupState
    instance.setupState = proxyRefs(setupRes);
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }
  // if (Component.render) {
  instance.render = Component.render;
  // console.log(instance, "最后的instance");
  // }
}
let currentInstance: instanceType | null = null;

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance: instanceType) {
  currentInstance = instance;
}

let compiler: any;
export function registerRuntimeCompiler(_compiler: any) {
  compiler = _compiler;
}
