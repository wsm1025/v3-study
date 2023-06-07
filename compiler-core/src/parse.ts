import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParserContext(content);
  return creteRoot(parseChild(context));
}

function parseChild(context: { source: string }) {
  const nodes = [];
  let node;
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context);
  }
  nodes.push(node);
  return nodes;
}

function parseInterpolation(context: { source: string }) {
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  advanceBy(context, openDelimiter.length);

  const rowContentlength = closeIndex - openDelimiter.length;
  const rowContent = context.source.slice(0, rowContentlength);
  const content = rowContent.trim();

  advanceBy(context, rowContentlength + closeDelimiter.length);

  return {
    type: NodeTypes.INTEPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advanceBy(context: { source: string | any[] }, length: number) {
  context.source = context.source.slice(length);
}
function creteRoot(children: any) {
  return {
    children,
  };
}
function createParserContext(content: string) {
  return {
    source: content,
  };
}
