type Subscriber = (() => void) & { label?: string };

let activeSubscriber: Subscriber | null = null;
const subscriberDeps = new Map<Subscriber, Set<Set<Subscriber>>>();

function cleanupSubscriber(subscriber: Subscriber) {
    const deps = subscriberDeps.get(subscriber);

    if (deps == null) {
        return;
    }

    console.log(`[cleanup] subscriber=${subscriber.label}`);
    for (const subscribers of deps) {
        subscribers.delete(subscriber);
    }
    deps.clear();
}

function track<T>(subscriber: Subscriber, fn: () => T): T {
    cleanupSubscriber(subscriber);

    try {
        activeSubscriber = subscriber;
        const result = fn();
        return result;
    } finally {
        activeSubscriber = null;
    }
}

function atom<T extends object>(initialValue: T): T {
    const subscribersByKey = new Map<string, Set<Subscriber>>();

    let proxy = new Proxy(initialValue, {
        get(target, key) {
            const property = String(key);
            let subscribers = subscribersByKey.get(property);

            if (activeSubscriber != null) {
                if (subscribers == null) {
                    subscribers = new Set<Subscriber>();
                    subscribersByKey.set(property, subscribers);
                }

                subscribers.add(activeSubscriber);

                console.log(
                    `[get] property=${property} subscriber=${activeSubscriber.label}`,
                );

                let deps = subscriberDeps.get(activeSubscriber);
                if (deps == null) {
                    deps = new Set<Set<Subscriber>>();
                    subscriberDeps.set(activeSubscriber, deps);
                }
                deps.add(subscribers);
            }

            return target[key as keyof T];
        },
        set(target, key, value) {
            let oldValue = target[key as keyof T];

            if (oldValue === value) {
                return true;
            }

            let property = String(key);
            let subscribers = subscribersByKey.get(property);

            console.log(
                `[set] property=${property} old=${String(oldValue)} new=${String(value)}`,
            );
            target[key as keyof T] = value;

            if (subscribers != null) {
                const subscribersToNotify = new Set(subscribers);
                for (const subscriber of subscribersToNotify) {
                    console.log(
                        `[notify] property=${property} & subscriber=${subscriber.label}`,
                    );
                    subscriber();
                }
            }

            return true;
        },
    });

    return proxy;
}

let state = atom({ showcount: true, count: 0, name: "Ram" });

function effect(label: string, fn: () => void) {
    const runner: Subscriber = () => {
        console.log(`[effect] run ${runner.label}`);
        track(runner, fn);
    };

    runner.label = label;
    runner();
}

effect("mainEffect", () => {
    if (state.showcount) {
        console.log(`[render] count=${state.count}`);
    } else {
        console.log(`[render] name=${state.name}`);
    }
});

state.count = 3;

state.showcount = false;
state.name = "hari";
state.name = "hari";
state.count = 10;
