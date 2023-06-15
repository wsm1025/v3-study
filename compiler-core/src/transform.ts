import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  // 遍历深度搜索
  traverseNode(root, context);
  // 修改值

  createRootCodegen(root);
  root.helpers = [...context.heplers.keys()];
}
function traverseNode(node: any, context: any) {
  const children = node.children;
  const nodePlugins = context!.nodePlugins;
  nodePlugins.map((plugin: (node: any) => any) => plugin(node));
  switch (node.type) {
    case NodeTypes.INTEPOLATION:
      context.hepler(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(children, context);

    default:
      break;
  }
}
function traverseChildren(children, context) {
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}
function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodePlugins: options.nodePlugins || [],
    heplers: new Map(),
    hepler(key: any) {
      context.heplers.set(key, 1);
    },
  };
  return context;
}
function createRootCodegen(root: any) {
  root.codegenNode = root.children[0];
}
