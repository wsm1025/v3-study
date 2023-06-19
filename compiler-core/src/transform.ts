import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  // 遍历深度搜索
  traverseNode(root, context);
  // 修改值

  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
}
function traverseNode(node: any, context: any) {
  const children = node.children;
  const exitFns: Array<Function> = [];
  const nodePlugins = context!.nodePlugins;
  for (let i = 0; i < nodePlugins.length; i++) {
    const nodePlugin = nodePlugins[i];
    const onExit = nodePlugin(node, context);
    if (onExit) exitFns.push(onExit);
  }
  switch (node.type) {
    case NodeTypes.INTEPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(children, context);

    default:
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
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
    helpers: new Map(),
    helper(key: any) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}
function createRootCodegen(root: { children: any[]; codegenNode: any }) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = child;
  }
}
