import { shallowReadOnly } from "../src/reactivity/reactive";
import { emit } from "./componentsEmit";
import { initProps } from "./componentsProps";
import { publicInstanceHandler } from "./componentsPublicInstance";
import { initSlots } from "./componentsSlots";
interface instanceType {
  vnode: any;
  type: any;
  setupState: {};
  props: {};
  emit: () => void;
  slots: {};
  provides: {};
  parent: any;
  proxy?: any;
}

export function createComponentInstance(vnode: { type: any }, parent: any) {
  console.log("createComponentInstance", parent);
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
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
    instance.setupState = setupRes;
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  // if (Component.render) {
  instance.render = Component.render;
  // console.log(instance, "最后的instance");
  // }
}
let currentInstance: instanceType | null = null;

export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance: instanceType) {
  currentInstance = instance;
}
