import { shallowReadOnly } from "../src/reactivity/reactive";
import { emit } from "./componentsEmit";
import { initProps } from "./componentsProps";
import { publicInstanceHandler } from "./componentsPublicInstance";
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  };
  // 第一个参数 为 null 不改变 this 那么 emit 函数的 第一个参数即为instance 用户再传第二个参数
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  // initSlots()
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
  console.log(instance, "instance");
  const Component = instance.type;
  // ctx
  instance.proxy = new Proxy({ _: instance }, publicInstanceHandler);
  const { setup } = Component;
  if (setup) {
    // 在这里把 setup 的数据 获取到
    const setupRes = setup(shallowReadOnly(instance.props), {
      emit: instance.emit,
    });
    handleSetupResult(instance, setupRes);
  }
}
function handleSetupResult(instance, setupRes: any) {
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

  console.log(instance, "最后的instance");
  // }
}
