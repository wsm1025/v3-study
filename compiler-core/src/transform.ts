export function transform(root, options) {
  const context = createTransformContext(root, options);
  // 遍历深度搜索
  traverseNode(root, context);
  // 修改值
}
function traverseNode(
  node: any,
  context: { root?: any; nodePlugins: any } | undefined
) {
  const children = node.children;
  const nodePlugins = context!.nodePlugins;
  nodePlugins.map((plugin: (node: any) => any) => plugin(node));
  traverseChildren(children, context);
}
function traverseChildren(children, context) {
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      traverseNode(node, context);
    }
  }
}
function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodePlugins: options.nodePlugins || [],
  };
  return context;
}
