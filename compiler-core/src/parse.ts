import { NodeTypes } from "./ast";
const enum TagType {
  start,
  end,
}
export function baseParse(content: string) {
  const context = createParserContext(content);
  return creteRoot(parseChild(context));
}

function parseChild(context: { source: string }) {
  const nodes = [];
  let node;
  let s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }
  if (!node) {
    node = parseText(context);
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

  const rowContent = parseTextData(context, rowContentlength);
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
function parseElement(context: any) {
  // 解析tag
  // 删除处理完成的代码
  const element = parseTag(context, TagType.start);
  parseTag(context, TagType.end);
  return element;
}
function parseTag(context: any, type) {
  const match = /^<\/?([a-z]*)/.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === TagType.end) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}
function parseText(context: { source: string }): any {
  const content = parseTextData(context, context.source.length);
  return {
    type: NodeTypes.TEXT,
    content: content,
  };
}
function parseTextData(context: { source: any }, length: number) {
  const content = context.source.slice(0, length);
  advanceBy(context, content.length);
  return content;
}
