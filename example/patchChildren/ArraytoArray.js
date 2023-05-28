import { h, ref } from "../../lib/myVue.esm.js";
const nextC = [h("div", null, "C"), h("div", null, "D")];
const prevC = [h("div", null, "A"), h("div", null, "B")];

export const ArraytoArray = {
  name: "ArraytoArray",
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
