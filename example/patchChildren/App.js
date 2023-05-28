import { h, ref } from "../../lib/myVue.esm.js";
import { ArraytoText } from "./ArraytoText.js";
import { textTotext } from "./textTotext.js";
import { textToArray } from "./textToArray.js";
import { ArraytoArray } from "./ArraytoArray.js";

export const App = {
  name: "APP",
  render() {
    // return h("div", { id: "root" }, [h("div", null, "主页"), h(ArraytoText)]);
    // return h("div", { id: "root" }, [h("div", null, "主页"), h(textTotext)]);
    // return h("div", { id: "root" }, [h("div", null, "主页"), h(textToArray)]);
    return h("div", { id: "root" }, [h("div", null, "主页"), h(ArraytoArray)]);
  },
  setup() {
    return {};
  },
};
