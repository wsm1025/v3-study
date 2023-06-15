import { NodeTypes } from "./ast";
const enum TagType {
  start,
  end,
}
export function baseParse(content: string) {
  const context = createParserContext(content);
  return creteRoot(parseChild(context, []));
}

function parseChild(context: { source: string }, ancestors) {
  const nodes = [];
  while (!isEnd(context, ancestors)) {
    let node;
    let s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function isEnd(context: { source: any }, ancestors): boolean {
  // 1.source有值
  // 2.遇到结束标签
  const s = context.source;
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }
  // if (ancestors && s.startsWith(`</${ancestors}>`)) {
  //   return true;
  // }
  return !s;
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

  advanceBy(context, closeDelimiter.length);

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
    type: NodeTypes.ROOT,
  };
}
function createParserContext(content: string) {
  return {
    source: content,
  };
}
function parseElement(context: any, ancestors) {
  // 解析tag
  // 删除处理完成的代码
  const element: any = parseTag(context, TagType.start);
  ancestors.push(element);
  element.children = parseChild(context, ancestors);
  ancestors.pop();
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.end);
  } else {
    throw new Error("缺少结束标签" + element.tag);
  }
  return element;
}

function startsWithEndTagOpen(source: string, tag): Boolean {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLocaleLowerCase() ===
      tag.toLocaleLowerCase()
  );
}
function parseTag(context: any, type) {
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
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
  let endIndex = context.source.length;
  const endToken = ["<", "{{"];
  for (let i = 0; i < endToken.length; i++) {
    const index = context.source.indexOf(endToken[i]);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content: content,
  };
}
function parseTextData(context: { source: any }, length: number) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}
