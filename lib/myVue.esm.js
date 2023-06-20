const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVnode(type, props, children) {
    const vnode = {
        type,
        props: props !== null && props !== void 0 ? props : {},
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
        key: props === null || props === void 0 ? void 0 : props.key,
        component: null,
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

function toDisplayString(value) {
    return String(value);
}

const isObject = (val) => {
    return val !== null && typeof val === "object";
};
const isString = (value) => typeof value === "string";
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
    $props: (i) => i.props,
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
        // 下次需要更新的虚拟节点
        n2: null,
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
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
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
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldUpdateComponent(preVnode, nextVnode) {
    const { props: preProps } = preVnode;
    const { props: nextProps } = nextVnode;
    for (const key in nextProps) {
        if (nextProps[key] !== preProps[key]) {
            return true;
        }
    }
    return false;
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

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement, insert: hostInsert, patchProps: hostPatchProp, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // n1 老数据
    // n2 新数据
    function patch(n1, n2, container, parentComponent, anchor) {
        // ShapeFlags
        // vnode => flag
        const { type, shapeFlag } = n2;
        // console.log(vnode, "vnode");
        // Fragment => 只渲染 所有的children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 处理组件
                // TODO 判断 vnode 是不是 elemnet
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPOENTS */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        // 创建组件
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        // 是否需要更新
        if (shouldUpdateComponent(n1, n2)) {
            // next 存储 下次需要更新的虚拟节点
            instance.next = n2;
            console.log("组件更新");
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
            console.log("组件不需要更新");
        }
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        // effect 返回值是一个 runner 可以 再次调用他 执行 他传递的函数 所以 在instance 上 挂载 所需要的更新函数
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log("init");
                const { proxy } = instance;
                // 虚拟节点树🌲
                // 存下来 好更新的时候对比
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // console.log(subTree, "subTree");
                patch(null, subTree, container, instance, anchor);
                // 这里的 subtree 即为 渲染完好的 h 信息
                initialVnode.el = subTree.el;
                // 这里说明已挂载
                instance.isMounted = true;
            }
            else {
                console.log("update");
                const { next, proxy, vnode } = instance;
                // 需要更新组件的 props
                if (next) {
                    // 更新 el
                    next.el = vnode.el;
                    // 更新相关属性
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                // 把最新的subtree 存起来 下次更新对比
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                // console.log(subTree, preSubTree);
                patch(preSubTree, subTree, container, instance, anchor);
            }
        }, {
            // 处理优化组件更新
            scheduler() {
                console.log("update-scheduler");
                queueJobs(instance.update);
            },
        });
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // init
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            // update
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 赋值给下一位
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
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
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // arrary diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSameVNodeType(n1, n2) {
            // type
            // key
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            let s1 = i;
            let s2 = i;
            const toBePatch = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatch);
            // 优化最长子序列
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 初始化映射表
            for (let i = 0; i < toBePatch; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatch) {
                    // 新数据 已经全部处理过了 那老数据 没有的部分 直接全部 delete
                    hostRemove(prevChild.el);
                    continue;
                }
                // null undefined
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j < e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 没查到 delete
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            // 采取倒叙操作
            for (let i = toBePatch - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 老的里面不存在 新的里面存在 需要 新增
                    patch(null, nextChild, container, parentComponent, anchor);
                    console.log("创建新节点", nextChild.el);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        console.log("移动位置", nextChild.el);
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
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
    function mountElement(vnode, container, parentComponent, anchor) {
        let { type, props, children, shapeFlag } = vnode;
        // type
        const el = (vnode.el = createElement(type));
        // 内容
        // console.log(children, "children");
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        else if (isObject(children)) {
            patch(null, children, el, parentComponent, null);
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
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, el, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, el, parentComponent, anchor);
        });
    }
    return {
        createApp: createAppApi(render),
    };
}
function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.next = null;
    instance.props = nextVnode.props;
}
function getSequence(arr) {
    const len = arr.length;
    const min_arr = [0]; // 存储最小的索引，以索引0为基准
    const prev_arr = arr.slice(); // 储存前面的索引，slice为浅复制一个新的数组
    let last_index;
    let start;
    let end;
    let middle;
    for (let i = 0; i < len; i++) {
        let arrI = arr[i];
        // 1. 如果当前n比min_arr最后一项大
        last_index = min_arr[min_arr.length - 1];
        if (arr[last_index] < arrI) {
            min_arr.push(i);
            prev_arr[i] = last_index; // 前面的索引
            continue;
        }
        // 2. 如果当前n比min_arr最后一项小（二分类查找）
        start = 0;
        end = min_arr.length - 1;
        while (start < end) {
            middle = (start + end) >> 1; // 相当于Math.floor((start + end)/2)
            if (arr[min_arr[middle]] < arrI) {
                start = middle + 1;
            }
            else {
                end = middle;
            }
        }
        if (arr[min_arr[end]] > arrI) {
            min_arr[end] = i;
            if (end > 0) {
                prev_arr[i] = min_arr[end - 1]; // 前面的索引
            }
        }
    }
    // 从最后一项往前查找
    let result = [];
    let i = min_arr.length;
    let last = min_arr[i - 1];
    while (i-- > 0) {
        result[i] = last;
        last = prev_arr[last];
    }
    return result;
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
function insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        console.log("删除节点", child);
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

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVnode: createVnode,
    createRenderer: createRenderer,
    creteTextVnode: creteTextVnode,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    nextTick: nextTick,
    provide: provide,
    proxyRefs: proxyRefs,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlot: renderSlot,
    toDisplayString: toDisplayString
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVnode");
const helpersMapNames = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVnode",
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");
    push(`function ${functionName}(${signature}){`);
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHeples = (s) => `${helpersMapNames[s]}:_${helpersMapNames[s]}`;
    if (ast.helpers.length) {
        push(`const { ${ast.helpers.map(aliasHeples).join(",")} }  =  ${VueBinging} `);
    }
    push("\n");
    push("return ");
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTEPOLATION */:
            genIntepolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genSimpleExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESS */:
            genCompoundExpress(node, context);
            break;
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genIntepolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
function genSimpleExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    // const child = children[0];
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // for (let i = 0; i < children.length; i++) {
    //   const child = children[i];
    //   genNode(child, context);
    // }
    genNodeList(genNull([tag, props, children]), context);
    // genNode(children, context);
    push(")");
}
function genNull(array) {
    return array.map((value) => value || "null");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genCompoundExpress(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helpersMapNames[key]}`;
        },
    };
    return context;
}

function baseParse(content) {
    const context = createParserContext(content);
    return creteRoot(parseChild(context, []));
}
function parseChild(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        let s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 1.source有值
    // 2.遇到结束标签
    const s = context.source;
    if (s.startsWith("</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // if (ancestors && s.startsWith(`</${ancestors}>`)) {
    //   return true;
    // }
    return !s;
}
function parseInterpolation(context) {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rowContentlength = closeIndex - openDelimiter.length;
    const rowContent = parseTextData(context, rowContentlength);
    const content = rowContent.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTEPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function creteRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function createParserContext(content) {
    return {
        source: content,
    };
}
function parseElement(context, ancestors) {
    // 解析tag
    // 删除处理完成的代码
    const element = parseTag(context, 0 /* TagType.start */);
    ancestors.push(element);
    element.children = parseChild(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.end */);
    }
    else {
        throw new Error("缺少结束标签" + element.tag);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLocaleLowerCase() ===
            tag.toLocaleLowerCase());
}
function parseTag(context, type) {
    const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* TagType.end */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
function parseText(context) {
    let endIndex = context.source.length;
    const endToken = ["<", "{{"];
    for (let i = 0; i < endToken.length; i++) {
        const index = context.source.indexOf(endToken[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content: content,
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 遍历深度搜索
    traverseNode(root, context);
    // 修改值
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function traverseNode(node, context) {
    const children = node.children;
    const exitFns = [];
    const nodePlugins = context.nodePlugins;
    for (let i = 0; i < nodePlugins.length; i++) {
        const nodePlugin = nodePlugins[i];
        const onExit = nodePlugin(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTEPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(children, context);
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(children, context) {
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodePlugins: options.nodePlugins || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}

function createVnodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // 中间处理层
            // tag
            let vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTEPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = "_ctx." + node.content;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTEPOLATION */;
}

function transformText(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            // 初始化一次
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    // 复杂类型
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESS */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            // 之前的next删除 移位操作
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            // 当前类型不是element
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodePlugins: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

// mini-vue 出口
function compilerToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compilerToFunction);

export { createApp, createVnode as createElementVnode, createRenderer, creteTextVnode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlot, toDisplayString };
