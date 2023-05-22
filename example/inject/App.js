// 组件 provide 和 inject 功能
import { h, provide, inject } from "../../lib/myVue.esm.js";

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "foo");
    provide("bar", "bar");
  },
  render() {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)]);
  },
};
const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooTwo");
    const foo = inject("foo");
    return { foo };
  },
  render() {
    return h("div", {}, [h("p", {}, `ProviderTwo ${this.foo}`), h(Consumer)]);
  },
};

const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    const baz = inject("baz", "bazzzzz");
    const baccc = inject("baccc", () => "bacccbacccbaccc");
    return {
      foo,
      bar,
      baz,
      baccc,
    };
  },
  render() {
    return h(
      "div",
      {},
      `Consumer->${this.foo}-${this.bar}->${this.baz}->${this.baccc}`
    );
  },
};

export const App = {
  name: "App",
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
  setup() {},
};
