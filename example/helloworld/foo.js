import { h, renderSlot } from "../../lib/myVue.esm.js";
export const Foo = {
  render() {
    const button = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "add"
    );
    return h("div", {}, [
      button,
      // 具名插槽
      // 作用域插槽
      h("div", {}, [
        renderSlot(this.$slots, "default"),
        button,
        // renderSlot(this.$slots, "footer"),
      ]),
    ]);
  },
  setup(props, { emit }) {
    props.count++;
    const emitAdd = () => {
      console.log("emitAdd");
      // 触发事件 父组件再去props上找 找到了触发
      emit("add", 1, 2);
      emit("add-foo");
    };
    console.log(props);
    return {
      emitAdd,
    };
  },
};
