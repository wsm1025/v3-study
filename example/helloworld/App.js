import { h } from "../../lib/myVue.esm.js";
export const App = {
  render() {
    // return h("div", { id: "root", class: ["red weight"] }, "hi," + "my vue");
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
