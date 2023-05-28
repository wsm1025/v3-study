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

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 这里会收集依赖 来自effect方法
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        // reset
        shouldTrack = false;
        return res;
    }
    stop() {
        if (this.active) {
            cleanEffect(this);
            this.active = false;
        }
    }
}
function cleanEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new Map();
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function track(target, key) {
    if (!isTracking()) {
        return;
    }
    // target-> key ->dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    console.log(dep, "dep");
    if (!dep) {
        console.log(key, "key");
        dep = new Map();
        depsMap.set(key, dep);
    }
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        effect.scheduler ? effect.scheduler() : effect.run();
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const extend = Object.assign;
const hasChange = (newValue, oldValue) => !Object.is(newValue, oldValue);
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
const EMPTY_OBJ = {};

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
        if (!isReadonly) {
            // 在触发 get 的时候进行依赖收集
            track(target, key);
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
        subTree: {},
        isMounted: false,
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
        instance.setupState = proxyRefs(setupRes);
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
    const { createElement, insert, patchProps: hostPatchProp, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    // n1 老数据
    // n2 新数据
    function patch(n1, n2, container, parentComponent) {
        // ShapeFlags
        // vnode => flag
        const { type, shapeFlag } = n2;
        // console.log(vnode, "vnode");
        // Fragment => 只渲染 所有的children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 处理组件
                // TODO 判断 vnode 是不是 elemnet
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPOENTS */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        effect(() => {
            if (!instance.isMounted) {
                console.log("init");
                const { proxy } = instance;
                // 虚拟节点树🌲
                // 存下来 好更新的时候对比
                const subTree = (instance.subTree = instance.render.call(proxy));
                // console.log(subTree, "subTree");
                patch(null, subTree, container, instance);
                // 这里的 subtree 即为 渲染完好的 h 信息
                initialVnode.el = subTree.el;
                // 这里说明已挂载
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                // 把最新的subtree 存起来 下次更新对比
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                // console.log(subTree, preSubTree);
                console.log("update");
                patch(preSubTree, subTree, container, instance);
            }
        });
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent);
        }
        else {
            // update
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 赋值给下一位
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const preShapeFlag = n1.shapeFlag;
        const { shapeFlag } = n2;
        const c1 = n1.children;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (preShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1. 把老的 children 清除
                unmountedChildren(n1.children);
                // 2. 设置新的 text
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // array
            if (preShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent);
            }
        }
    }
    function unmountedChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (newProps !== oldProps) {
            for (const key in newProps) {
                const preProp = oldProps[key];
                const nextProp = newProps[key];
                if (preProp !== nextProp) {
                    hostPatchProp(el, key, preProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
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
            mountChildren(vnode.children, el, parentComponent);
        }
        else if (isObject(children)) {
            patch(null, children, el, parentComponent);
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
                hostPatchProp(el, key, null, props[key]);
            }
        }
        // container.appendChild(el);
        insert(el, container);
    }
    function mountChildren(children, el, parentComponent) {
        children.forEach((v) => {
            patch(null, v, el, parentComponent);
        });
    }
    return {
        createApp: createAppApi(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, preValue, nextValue) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // on + event
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextValue);
    }
    else {
        if ([undefined, null].includes(nextValue)) {
            return el.removeAttribute(key);
        }
        el.setAttribute(key, nextValue);
    }
}
function insert(el, parent) {
    parent.appendChild(el);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

class RefImpl {
    constructor(value) {
        this._v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 值改变了才会 去收集依赖
        if (hasChange(newValue, this._rawValue)) {
            // 先去修改 value
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref._v_isRef;
}
function unRef(ref) {
    // 先检查是否ref
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(ref) {
    return new Proxy(ref, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // set -> ref-> .value
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

export { createApp, createRenderer, creteTextVnode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlot };
