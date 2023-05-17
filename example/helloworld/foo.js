import { h } from "../../lib/myVue.esm.js";
export const Foo = {
  render() {
    return h("div", { el: 10 }, "foo:" + this.count);
  },
  setup(props) {
    props.count++;
    console.log(props);
  },
};
