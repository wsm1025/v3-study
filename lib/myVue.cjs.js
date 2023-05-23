'use strict';

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVnode(type, props, children) {
    const vnode = {
        type,
        props: props !== null && props !== void 0 ? props : {},
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    //组件类型 +  children object ==>slot
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPOENTS */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function creteTextVnode(text) {
    return createVnode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPOENTS */;
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

const renderSlot = (slots, name, props) => {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVnode(Fragment, {}, slot(props));
        }
    }
};

const targetMap = new Map();
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        effect.scheduler ? effect.scheduler() : effect.run();
    }
}

const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const extend = Object.assign;
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, r) => {
        return r ? r.toLocaleUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
};
const handlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

const get = createGetter();
const set = createSetter();
const shallowReadOnlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "_v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "_v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 这里实现嵌套reactive 逻辑
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const result = Reflect.set(target, key, value);
        // 在触发 set 的时候进行触发依赖
        trigger(target, key);
        return result;
    };
}
const readonlyHandlers = {
    get: createGetter(true),
    set(target, key) {
        // readonly 的响应式对象不可以修改值
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        return true;
    },
};
const proxyHandlers = {
    get,
    set,
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadOnlyGet,
});

function reactive(raw) {
    return createProxy(raw, proxyHandlers);
}
function readonly(raw) {
    return createProxy(raw, readonlyHandlers);
}
function shallowReadOnly(raw) {
    return createProxy(raw, shallowReadonlyHandlers);
}
function createProxy(raw, baseProxy) {
    return new Proxy(raw, baseProxy);
}

function emit(instance, event, ...args) {
    // console.log("emit", event);
    // instance.props => event
    const { props } = instance;
    // TPP
    const handler = props[handlerKey(camelize(event))];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    // console.log(rawProps, "rawProps");
    instance.props = rawProps;
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const publicInstanceHandler = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        // console.log(setupState, "setupState");
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        if (publicPropertiesMap[key]) {
            return publicPropertiesMap[key](instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        const slots = {};
        for (const key in children) {
            const value = children[key];
            slots[key] = (props) => dealSlots(value(props));
        }
        instance.slots = slots;
    }
}
function dealSlots(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    console.log("createComponentInstance", parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
    };
    // 第一个参数 为 null 不改变 this 那么 emit 函数的 第一个参数即为instance 用户再传第二个参数
    // 这里 instance 即为 父组件
    // console.log(vnode, "component");
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // console.log(instance, "instance");
    const Component = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, publicInstanceHandler);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // 在这里把 setup 的数据 获取到
        const setupRes = setup(shallowReadOnly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
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
    // console.log(instance, "最后的instance");
    // }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        const parentProvides = parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}
function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        //  改写原型 指向 且 这里只会执行一次
        console.log(provides, parentProvides);
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转化 虚拟节点 vnode
                // component => vnode
                // 所有逻辑操作 都是基于虚拟节点
                const vnode = createVnode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement, insert, patchProps } = options;
    function render(vnode, container) {
        patch(vnode, container, null);
    }
    function patch(vnode, container, parentComponent) {
        // ShapeFlags
        // vnode => flag
        const { type, shapeFlag } = vnode;
        // console.log(vnode, "vnode");
        // Fragment => 只渲染 所有的children
        switch (type) {
            case Fragment:
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
            default:
                // 处理组件
                // TODO 判断 vnode 是不是 elemnet
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(vnode, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPOENTS */) {
                    processComponent(vnode, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent);
    }
    function processText(vnode, container) {
        const { children } = vnode;
        const textNode = (vnode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processComponent(vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        const { proxy } = instance;
        // 虚拟节点树🌲
        const subTree = instance.render.call(proxy);
        // console.log(subTree, "subTree");
        patch(subTree, container, instance);
        // 这里的 subtree 即为 渲染完好的 h 信息
        initialVnode.el = subTree.el;
    }
    function processElement(vnode, container, parentComponent) {
        // init
        mountElement(vnode, container, parentComponent);
        // update
    }
    function mountElement(vnode, container, parentComponent) {
        let { type, props, children, shapeFlag } = vnode;
        // type
        const el = (vnode.el = createElement(type));
        // 内容
        // console.log(children, "children");
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        else if (isObject(children)) {
            patch(children, el, parentComponent);
        }
        // props
        if (props) {
            for (const key in props) {
                // const isOn = (key: string) => /^on[A-Z]/.test(key);
                // if (isOn(key)) {
                //   // on + event
                //   const event = key.slice(2).toLocaleLowerCase();
                //   el.addEventListener(event, props[key]);
                // } else {
                //   el.setAttribute(key, props[key]);
                // }
                patchProps(el, key, props);
            }
        }
        // container.appendChild(el);
        insert(el, container);
    }
    function mountChildren(vnode, el, parentComponent) {
        vnode.children.forEach((v) => {
            patch(v, el, parentComponent);
        });
    }
    return {
        createApp: createAppApi(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, props) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // on + event
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, props[key]);
    }
    else {
        el.setAttribute(key, props[key]);
    }
}
function insert(el, parent) {
    parent.appendChild(el);
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.creteTextVnode = creteTextVnode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlot = renderSlot;
