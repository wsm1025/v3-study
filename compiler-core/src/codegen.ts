import { isString } from "../../share";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  TO_DISPLAY_STRING,
  helpersMapNames,
} from "./runtimeHelpers";

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
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESS:
      genCompoundExpress(node, context);
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
function genElement(node: any, context: any) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  // const child = children[0];
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  // for (let i = 0; i < children.length; i++) {
  //   const child = children[i];
  //   genNode(child, context);
  // }
  genNodeList(genNull([tag, props, children]), context);
  // genNode(children, context);
  push(")");
}

function genNull(array) {
  return array.map((value) => value || "null");
}
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}
function genCompoundExpress(node: any, context: any) {
  const { push } = context;

  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
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
