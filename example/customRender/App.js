import { h } from "../../lib/myVue.esm.js";
export const App = {
  name: "APP",
  render() {
    return h("rect", { x: this.x, y: this.y });
  },
  setup() {
    return {
      x: 100,
      y: 100,
    };
  },
};
