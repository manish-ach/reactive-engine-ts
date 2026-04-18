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
    const subscribers_count = new Set();
    const subscribers_name = new Set();
    let proxy = new Proxy(initialValue, {
        get(target, key) {
            if (activeSubscriber != null) {
                console.log(`adding activeSubscriber to subscribers set`);
                if (String(key) === "count") {
                    console.log("actually adding lol");
                    subscribers_count.add(activeSubscriber);
                }
                if (String(key) === "name") {
                    console.log("does name too added?");
                    subscribers_name.add(activeSubscriber);
                }
            }
            return target[key];
        },
        set(target, key, value) {
            console.log(`setting ${String(value)}`);
            target[key] = value;
            if (String(key) === "count") {
                for (const subscriber of subscribers_count) {
                    console.log("notifying subscriber of count");
                    //subscriber();
                }
            }
            if (String(key) === "name") {
                for (const subscriber of subscribers_name) {
                    console.log("notifying subscriber of name");
                    //subscriber();
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
state.name = "hari";
