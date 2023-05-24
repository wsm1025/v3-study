import { h, ref } from "../../lib/myVue.esm.js";
export const App = {
  name: "APP",
  render() {
    return h("div", { id: "root", ...this.props }, [
      h("div", {}, "count: " + `${this.count}`),
      h(
        "button",
        {
          onClick: this.countClick,
        },
        "click"
      ),
      h(
        "button",
        {
          onClick: this.change1,
        },
        "修改值修改"
      ),
      h(
        "button",
        {
          onClick: this.change2,
        },
        "变成undefined删除"
      ),
      h(
        "button",
        {
          onClick: this.change3,
        },
        "变成对象删除"
      ),
    ]);
  },
  setup() {
    const count = ref(0);
    const countClick = () => {
      count.value++;
    };
    const props = ref({});
    const change1 = () => {
      console.log(props);

      props.value.foo = "new foo";
      console.log(props);
    };
    const change2 = () => {
      props.value.foo = undefined;
    };
    const change3 = () => {
      props.value = {
        foo: "foo",
      };
    };
    return {
      count,
      countClick,
      change1,
      change2,
      change3,
      props,
    };
  },
};
