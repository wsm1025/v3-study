import { App } from "./App.js";
import { createRenderer } from "../../lib/myVue.esm.js";
console.log(PIXI);

const game = new PIXI.Application({
  width: 500,
  height: 500,
});

document.body.append(game.view);
const renderer = createRenderer({
  createElement(type) {
    if (type === "rect") {
      const rect = new PIXI.Graphics();
      rect.beginFill("white");
      rect.drawRect(0, 0, 100, 100);
      rect.endFill();
      return rect;
    }
  },
  patchProps(el, key, props) {
    el[key] = props[key];
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

renderer.createApp(App).mount(game.stage);
// const container = document.getElementById("app");
// createApp(App).mount(container);
