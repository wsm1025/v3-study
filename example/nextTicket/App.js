import { h, ref, getCurrentInstance, nextTick } from "../../lib/myVue.esm.js";

export const App = {
  name: "App",
  setup() {
    const msg = ref(1);
    const instance = getCurrentInstance();

    async function onClick() {
      for (let index = 0; index < 100; index++) {
        msg.value = index;
      }
      console.log(instance.vnode.el);
      nextTick(() => {
        console.log(instance.vnode.el);
      });
      // await nextTick();
      // console.log(instance.vnode.el);
    }

    return { msg, onClick };
  },

  render() {
    const button = h("button", { onClick: this.onClick }, "update");
    const p = h("p", null, "msg:" + this.msg);

    return h("div", null, [button, p]);
  },
};
