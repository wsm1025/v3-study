import { createRenderer } from "../runtime-core";
function createElement(type) {
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
function insert(el: any, parent: Element) {
  parent.appendChild(el);
}

function remove(child: { parentNode: any }) {
  const parent = child.parentNode;
  if (parent) {
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
