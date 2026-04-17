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

function atom<T extends object>(initialValue: T) {
    const subscribers = new Set<Subscriber>();

    let proxy = new Proxy(initialValue, {
        get(target, key) {
            if (activeSubscriber != null) {
                console.log(`adding to subscribers set`);
                subscribers.add(activeSubscriber);
            }
            return target[key as keyof T];
        },
        set(target, key, value) {
            target[key as keyof T] = value;

            for (const subscriber of subscribers) {
                console.log(subscriber);
                subscriber();
            }
            return true;
        },
    });

    return proxy;
}

let state = atom({ count: 0 });

function effect() {
    console.log(`state change ${state.count}`);
}

track(effect, () => {
    effect();
});

state.count = 1;
