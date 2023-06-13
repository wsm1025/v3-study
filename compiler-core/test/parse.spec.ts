import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
describe("Parse", () => {
  describe("intepolation", () => {
    test("simple intepolation", () => {
      const ast = baseParse("{{message}}");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTEPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });
  describe("element", () => {
    test("simple element", () => {
      const ast = baseParse("<div></div>");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
        children: [],
      });
    });
  });

  describe("text", () => {
    test("simple text", () => {
      const ast = baseParse("some text hahh");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "some text hahh",
      });
    });
  });

  test("hi", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "hi,",
        },
        {
          type: NodeTypes.INTEPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  test("nest elemnt", () => {
    const ast = baseParse("<div><p>hi</p>{{message}}</div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeTypes.TEXT,
              content: "hi",
            },
          ],
        },
        {
          type: NodeTypes.INTEPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  test("throw error when no endTag", () => {
    expect(() => {
      baseParse("<div><span></div>");
    }).toThrow("缺少结束标签" + "span");
  });
});
