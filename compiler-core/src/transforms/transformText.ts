import { NodeTypes } from "../ast";
import { isText } from "../utils";

export function transformText(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let currentContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              // 初始化一次
              if (!currentContainer) {
                currentContainer = children[i] = {
                  // 复杂类型
                  type: NodeTypes.COMPOUND_EXPRESS,
                  children: [child],
                };
              }
              currentContainer.children.push(" + ");
              currentContainer.children.push(next);
              // 之前的next删除 移位操作
              children.splice(j, 1);
              j--;
            } else {
              // 当前类型不是element
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
