import { NodeTypes, createVnodeCall } from "../ast";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 中间处理层
      // tag
      let vnodeTag = `'${node.tag}'`;
      // props
      let vnodeProps;
      // children
      const children = node.children;
      let vnodeChildren = children[0];
      node.codegenNode = createVnodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    };
  }
}
