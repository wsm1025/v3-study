import { App } from "./App.js";
import { createApp } from "../../lib/myVue.esm.js";
const container = document.getElementById("#app");
createApp(App).mount(container);
