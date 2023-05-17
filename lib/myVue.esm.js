const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const extend = Object.assign;
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

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

function initProps(instance, rawProps) {
    console.log(rawProps, "rawProps");
    instance.props = rawProps;
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const publicInstanceHandler = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        console.log(setupState, "setupState");
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
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
        const setupRes = setup(shallowReadOnly(instance.props));
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
    // ShapeFlags
    // vnode => flag
    const { shapeFlag } = vnode;
    console.log(vnode, "vnode");
    // 处理组件
    // TODO 判断 vnode 是不是 elemnet
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPOENTS */) {
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    // 虚拟节点树🌲
    const subTree = instance.render.call(proxy);
    console.log(subTree, "subTree");
    patch(subTree, container);
    // 这里的 subtree 即为 渲染完好的 h 信息
    initialVnode.el = subTree.el;
}
function processElement(vnode, container) {
    // init
    mountElement(vnode, container);
    // update
}
function mountElement(vnode, container) {
    let { type, props, children, shapeFlag } = vnode;
    // type
    const el = (vnode.el = document.createElement(type));
    // 内容
    console.log(children, "children");
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el);
    }
    else if (isObject(children)) {
        patch(children, el);
    }
    // props
    if (props) {
        for (const key in props) {
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
    }
    container.appendChild(el);
    function mountChildren(children, el) {
        children.forEach((v) => {
            patch(v, el);
        });
    }
}

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
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPOENTS */;
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

export { createApp, h };
