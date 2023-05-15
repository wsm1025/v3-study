'use strict';

const isObject = (val) => {
    return val !== null && typeof val === "object";
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const publicInstanceHandler = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        console.log(setupState, "setupState");
        if (key in setupState) {
            return setupState[key];
        }
        if (publicPropertiesMap[key]) {
            return publicPropertiesMap[key](instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}
function setupComponent(instance) {
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    console.log(instance, "instance");
    const Component = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, publicInstanceHandler);
    const { setup } = Component;
    if (setup) {
        // 在这里把 setup 的数据 获取到
        const setupRes = setup();
        handleSetupResult(instance, setupRes);
    }
}
function handleSetupResult(instance, setupRes) {
    // function object
    // TODO function
    if (typeof setupRes === "object") {
        // 在这里把 setup 的数据 挂载在 setupState
        instance.setupState = setupRes;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // if (Component.render) {
    instance.render = Component.render;
    console.log(instance, "最后的instance");
    // }
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    console.log(vnode, "path");
    // 处理组件
    // TODO 判断 vnode 是不是 elemnet
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    // 虚拟节点树🌲
    const subTree = instance.render.call(proxy);
    console.log(subTree, "subTree");
    patch(subTree, container);
    // 这里的 subtree 即为 渲染完好的 h 信息
    vnode.el = subTree.el;
}
function processElement(vnode, container) {
    // init
    mountElement(vnode, container);
    // update
}
function mountElement(vnode, container) {
    let { type, props, children } = vnode;
    // type
    const el = (vnode.el = document.createElement(type));
    // 内容
    console.log(children);
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(children, container);
    }
    else if (isObject(children)) {
        patch(children, el);
    }
    // props
    if (props) {
        for (const key in props) {
            el.setAttribute(key, props[key]);
        }
    }
    container.appendChild(el);
    function mountChildren(children, el) {
        children.forEach((v) => {
            patch(v, el);
        });
    }
}

function createVnode(type, props, children) {
    return {
        type,
        props,
        children,
        el: null,
    };
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转化 虚拟节点 vnode
            // component => vnode
            // 所有逻辑操作 都是基于虚拟节点
            const vnode = createVnode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
