type Subscriber = () => void;

let activeSubscriber: Subscriber | null = null;

function track<T>(subscriber: Subscriber, fn: () => T): T {
    try {
        activeSubscriber = subscriber;
        const result = fn();
        return result;
    } finally {
        activeSubscriber = null;
    }
}

function atom<T extends object>(initialValue: T): T {
    const subscriberByKey = new Map<string, Set<Subscriber>>();

    let proxy = new Proxy(initialValue, {
        get(target, key) {
            const property = String(key);
            let subscribers = subscriberByKey.get(property);

            if (subscribers == null) {
                subscribers = new Set<Subscriber>();
                subscriberByKey.set(property, subscribers);
            }

            if (activeSubscriber != null) {
                console.log(`adding activeSubscriber to subscribers set`);
                subscribers.add(activeSubscriber);
            }
            return target[key as keyof T];
        },
        set(target, key, value) {
            console.log(`\nsetting - ${String(value)}`);
            target[key as keyof T] = value;

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

function effect(fn: () => void) {
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
