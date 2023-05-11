import { render } from "./renderer";
import { createVnode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 先转化 虚拟节点 vnode
      // component => vnode
      // 所有逻辑操作 都是基于虚拟节点
      const vnode = createVnode(rootComponent);
      render(vnode, rootComponent);
    },
  };
}
