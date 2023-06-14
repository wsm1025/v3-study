import { transform } from "../src/transform";
import { baseParse } from "../src/parse";
import { NodeTypes } from "../src/ast";

describe("transform", () => {
  test("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}<p>hi11</p></div>");
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += "myvue";
      }
    };
    transform(ast, {
      nodePlugins: [plugin],
    });
    console.log(ast.children[0].children[2].children);
    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe("hi,myvue");
  });
});
