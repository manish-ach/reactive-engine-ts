"use strict";
let activeSubscriber = null;
const subscriberDeps = new Map();
function cleanupSubscriber(subscriber) {
    const deps = subscriberDeps.get(subscriber);
    if (deps == null) {
        return;
    }
    for (const subscribers of deps) {
        subscribers.delete(subscriber);
    }
    deps.clear();
}
function track(subscriber, fn) {
    cleanupSubscriber(subscriber);
    try {
        activeSubscriber = subscriber;
        const result = fn();
        return result;
    }
    finally {
        activeSubscriber = null;
    }
}
function atom(initialValue) {
    const subscribersByKey = new Map();
    let proxy = new Proxy(initialValue, {
        get(target, key) {
            const property = String(key);
            let subscribers = subscribersByKey.get(property);
            if (activeSubscriber != null) {
                if (subscribers == null) {
                    subscribers = new Set();
                    subscribersByKey.set(property, subscribers);
                }
                console.log(`adding activeSubscriber to subscribers set`);
                subscribers.add(activeSubscriber);
                let deps = subscriberDeps.get(activeSubscriber);
                if (deps == null) {
                    deps = new Set();
                    subscriberDeps.set(activeSubscriber, deps);
                }
                deps.add(subscribers);
            }
            return target[key];
        },
        set(target, key, value) {
            console.log(`\nsetting - ${String(value)}`);
            target[key] = value;
            let property = String(key);
            let subscribers = subscribersByKey.get(property);
            if (subscribers != null) {
                const subscribersToNotify = new Set(subscribers);
                for (const subscriber of subscribersToNotify) {
                    console.log(`notifying subscribers of - ${property}`);
                    subscriber();
                }
            }
            return true;
        },
    });
    return proxy;
}
let state = atom({ showcount: true, count: 0, name: "Ram" });
function effect(fn) {
    const runner = () => {
        track(runner, fn);
    };
    runner();
}
effect(() => {
    if (state.showcount) {
        console.log("count effect", state.count);
    }
    else {
        console.log(state.name);
    }
});
state.count = 3;
state.showcount = false;
state.name = "hari";
state.count = 10;
