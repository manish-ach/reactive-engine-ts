"use strict";
let activeSubscriber = null;
function track(subscriber, fn) {
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
    const subscriberByKey = new Map();
    let proxy = new Proxy(initialValue, {
        get(target, key) {
            const property = String(key);
            let subscribers = subscriberByKey.get(property);
            if (subscribers == null) {
                subscribers = new Set();
                subscriberByKey.set(property, subscribers);
            }
            if (activeSubscriber != null) {
                console.log(`adding activeSubscriber to subscribers set`);
                subscribers.add(activeSubscriber);
            }
            return target[key];
        },
        set(target, key, value) {
            console.log(`\nsetting - ${String(value)}`);
            target[key] = value;
            let property = String(key);
            let subscibers = subscriberByKey.get(property);
            if (subscibers != null) {
                for (const subscriber of subscibers) {
                    console.log(`notifying subscribers of - ${property}`);
                    subscriber();
                }
            }
            return true;
        },
    });
    return proxy;
}
let state = atom({ count: 0, name: "Ram" });
function effect(fn) {
    const runner = () => {
        track(runner, fn);
    };
    runner();
}
effect(() => {
    console.log("count effect", state.count);
});
state.count = 3;
state.name = "hari";
