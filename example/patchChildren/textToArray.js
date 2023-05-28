import { h, ref } from "../../lib/myVue.esm.js";
const prevC = "newChildren";
const nextC = [h("div", null, "A"), h("div", null, "B")];

export const textToArray = {
  name: "textToArray",
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
