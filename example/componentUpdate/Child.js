import { h } from "../../lib/myVue.esm.js";
export default {
  name: "Child",
  setup() {},
  render() {
    return h("div", {}, [h("div", {}, "child" + this.$props.msg)]);
  },
};
