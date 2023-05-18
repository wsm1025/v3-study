import { h } from "../../lib/myVue.esm.js";
import { Foo } from "./foo.js";
export const App = {
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["red weight"],
      },
      [
        h("div", { id: "el" }, "hi"),
        h("p", { class: ["blue"] }, h("span", { id: "el" }, "niubi")),
        h(Foo, {
          count: 2,
          onAdd: (a, b) => {
            this.add(a, b);
          },
          onAddFoo() {
            console.log("onaddfoo");
          },
        }),
      ]
    );
  },
  setup() {
    const add = (a, b) => {
      console.log("这是appjs的add事件", a, b);
    };
    return {
      add,
    };
  },
};
