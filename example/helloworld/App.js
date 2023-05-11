import { h } from "../../lib/myVue.esm.js";
export const App = {
  render() {
    return h("div", "hi" + this.message);
  },
  setup() {
    return {
      message: "my vue",
    };
  },
};
