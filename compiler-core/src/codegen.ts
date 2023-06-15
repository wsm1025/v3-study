import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING, helpersMapNames } from "./runtimeHelpers";

export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;
  genFunctionPreamble(ast, context);
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(",");
  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push("}");
  return {
    code: context.code,
  };
}
function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "Vue";
  const aliasHeples = (s: string) =>
    `${helpersMapNames[s]}:_${helpersMapNames[s]}`;
  if (ast.helpers.length) {
    push(
      `const { ${ast.helpers.map(aliasHeples).join(",")} }  =  ${VueBinging} `
    );
  }
  push("\n");
  push("return ");
}
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTEPOLATION:
      genIntepolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genSimpleExpression(node, context);
      break;
    default:
      break;
  }
}
function genText(node: any, context: any) {
  const { push } = context;
  push(`'${node.content}'`);
}
function genIntepolation(node: any, context: any) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}
function genSimpleExpression(node: any, context: any) {
  const { push } = context;

  push(`${node.content}`);
}

function createCodegenContext() {
  const context = {
    code: "",
    push(source: string) {
      context.code += source;
    },
    helper(key) {
      return `_${helpersMapNames[key]}`;
    },
  };
  return context;
}
