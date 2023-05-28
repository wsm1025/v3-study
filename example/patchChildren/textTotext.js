import { h, ref } from "../../lib/myVue.esm.js";
const nextC = "newChildren";
const prevC = "oldChildren";

export const textTotext = {
  name: "textTotext",
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
