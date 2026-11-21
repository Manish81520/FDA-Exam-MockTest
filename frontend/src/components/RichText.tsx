import { createElement, type ReactNode } from "react";

type TextNode = { text: string };
type ElementNode = { tag: string; children: RichNode[] };
type RichNode = TextNode | ElementNode;

const TAGS = new Set([
  "a", "b", "blockquote", "br", "caption", "code", "del", "div", "em", "h1", "h2",
  "h3", "h4", "h5", "h6", "hr", "i", "ins", "kbd", "li", "mark", "ol", "p", "pre",
  "s", "small", "span", "strike", "strong", "sub", "sup", "table", "tbody", "td",
  "tfoot", "th", "thead", "tr", "u", "ul",
]);
const VOID_TAGS = new Set(["br", "hr"]);
const BLOCKED_CONTENT_TAGS = new Set(["iframe", "math", "noscript", "object", "script", "style", "svg", "template"]);
const TOKEN = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>|[^<]+|</gi;
const TAG = /^<\s*(\/?)\s*([a-z][a-z0-9]*)\b[^>]*>$/i;

function decodeEntities(value: string): string {
  const textarea = document.createElement("textarea");
  // Keep markup-looking text inside the textarea while decoding character references.
  textarea.innerHTML = value.replace(/</g, "&lt;");
  return textarea.value;
}

function parseMarkup(value: string): RichNode[] {
  const root: ElementNode = { tag: "", children: [] };
  const stack = [root];
  let blockedTag: string | null = null;

  for (const token of value.match(TOKEN) ?? []) {
    if (token.startsWith("<!--") || token.startsWith("<!")) continue;
    const match = TAG.exec(token);
    if (!match) {
      if (!blockedTag) stack[stack.length - 1].children.push({ text: decodeEntities(token) });
      continue;
    }

    const [, closing, rawTag] = match;
    const tag = rawTag.toLowerCase();
    if (blockedTag) {
      if (closing && tag === blockedTag) blockedTag = null;
      continue;
    }
    if (BLOCKED_CONTENT_TAGS.has(tag)) {
      if (!closing) blockedTag = tag;
      continue;
    }
    if (!TAGS.has(tag)) continue;
    if (closing) {
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tag === tag) {
          stack.length = index;
          break;
        }
      }
      continue;
    }

    const node: ElementNode = { tag, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!VOID_TAGS.has(tag) && !/\/\s*>$/.test(token)) stack.push(node);
  }

  return root.children;
}

function renderNodes(nodes: RichNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if ("text" in node) return node.text;
    if (VOID_TAGS.has(node.tag)) return createElement(node.tag, { key });
    return createElement(node.tag, { key }, renderNodes(node.children, key));
  });
}

export default function RichText({ content }: { content: string }) {
  return <>{renderNodes(parseMarkup(content), "rich")}</>;
}
