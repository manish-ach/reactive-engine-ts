import { atom, effect } from "./reactivity";

let state = atom({ showcount: true, count: 0, name: "Ram" });

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
