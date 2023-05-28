import { h, ref } from "../../lib/myVue.esm.js";
const nextC = "newChildren";
const prevC = [h("div", null, "A"), h("div", null, "B")];

export const ArraytoText = {
  name: "ArraytoText",
  render() {
    return this.isChange ? h("div", null, nextC) : h("div", null, prevC);
  },
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
};
