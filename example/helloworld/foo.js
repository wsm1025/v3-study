import { h } from "../../lib/myVue.esm.js";
export const Foo = {
  render() {
    const button = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "add"
    );
    return h("div", { el: 10 }, ["foo:" + this.count, button]);
  },
  setup(props, { emit }) {
    props.count++;
    const emitAdd = () => {
      console.log("emitAdd");
      emit("add", 1, 2);
      emit("add-foo");
    };
    console.log(props);
    return {
      emitAdd,
    };
  },
};
