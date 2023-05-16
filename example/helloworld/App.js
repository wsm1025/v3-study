import { h } from "../../lib/myVue.esm.js";
window.slef = null;
export const App = {
  render() {
    window.self = this;
    // return h(
    //   "div",
    //   { id: "root", class: ["red weight"] },
    //   "hi," + this.message
    // );
    return h("div", { id: "root", class: ["red weight"] }, [
      h("div", null, "hi"),
      h("p", { class: ["blue"] }, h("span", null, "niubi")),
    ]);
  },
  setup() {
    return {
      message: "my vue",
    };
  },
};
