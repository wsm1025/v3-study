import { createRenderer } from "../runtime-core";
function createElement(type: any) {
  return document.createElement(type);
}
function patchProps(el, key, preValue, nextValue) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    // on + event
    const event = key.slice(2).toLocaleLowerCase();
    el.addEventListener(event, nextValue);
  } else {
    if ([undefined, null].includes(nextValue)) {
      return el.removeAttribute(key);
    }
    el.setAttribute(key, nextValue);
  }
}
function insert(child: any, parent: Element, anchor = null) {
  parent.insertBefore(child, anchor);
}

function remove(child: { parentNode: any }) {
  const parent = child.parentNode;
  if (parent) {
    console.log("删除节点", child);
    parent.removeChild(child);
  }
}
function setElementText(el: Element, text: string) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
  remove,
  setElementText,
});

export function createApp(...args: any[]) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
