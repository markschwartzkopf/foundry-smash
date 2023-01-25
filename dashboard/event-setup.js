"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventInfoRep = nodecg.Replicant('event-info');
let url = document.getElementById('url');
let name = document.getElementById('name');
url.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        NodeCG.waitForReplicants(eventInfoRep).then(() => {
            eventInfoRep.value.url = url.value;
        });
    }
};
name.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        NodeCG.waitForReplicants(eventInfoRep).then(() => {
            eventInfoRep.value.name = name.value;
        });
    }
};
eventInfoRep.on('change', (newVal) => {
    url.value = newVal.url;
    name.value = newVal.name;
});
