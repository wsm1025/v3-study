import { createComponentInstance, setupComponent } from "./componets";

export function render(vnode, container) {
  patch(vnode, container);
}
function patch(vnode, container) {
  // 处理组件
  processComponent(vnode, container);
  // TODO 判断 vnode 是不是 elemnet
  // processElement()
}
function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, container);
}
function setupRenderEffect(instance: any, container: any) {
  // 虚拟节点树🌲
  const subTree = instance.render();
  patch(subTree, container);
}
