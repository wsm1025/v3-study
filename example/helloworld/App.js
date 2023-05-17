import { h } from "../../lib/myVue.esm.js";
import { Foo } from "./foo.js";
export const App = {
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["red weight"],
        onClick() {
          console.log(11);
        },
      },
      [
        h("div", { id: "el" }, "hi"),
        h("p", { class: ["blue"] }, h("span", { id: "el" }, "niubi")),
        h(Foo, { count: 2 }),
      ]
    );
  },
  setup() {
    return {};
  },
};
