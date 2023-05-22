import { h, creteTextVnode, getCurrentInstance } from "../../lib/myVue.esm.js";
import { Foo } from "./foo.js";
export const App = {
  name: "APP",
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
        h(
          Foo,
          {
            count: 2,
            onAdd: (a, b) => {
              this.add(a, b);
            },
            onAddFoo() {
              console.log("onaddfoo");
            },
          },
          {
            // {
            // header: ({ age }) => h("p", {}, "slots" + age),
            // footer: () => h("button", {}, "i am slotsButton"),
            // }
            default: () => [
              h("p", {}, "我是普通插槽"),
              creteTextVnode("你好鸭子"),
            ],
          }
        ),
      ]
    );
  },
  setup() {
    const instance = getCurrentInstance();
    console.log("APP=>", instance);
    const add = (a, b) => {
      console.log("这是appjs的add事件", a, b);
    };

    return {
      add,
    };
  },
};
