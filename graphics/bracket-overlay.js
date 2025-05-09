"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playTypeRep = nodecg.Replicant('playType');
const eventInfoRep = nodecg.Replicant('event-info');
const logosRep = nodecg.Replicant('assets:event-logos');
const eventRep = nodecg.Replicant('event');
let playTypeDiv = document.getElementById('category');
let eventName = document.getElementById('header-main-text');
let eventUrl = document.getElementById('footer');
let logo = document.getElementById('corner-svg');
/* playTypeRep.on('change', (newValue) => {
    if (newValue == 'singles') playTypeDiv.innerHTML = 'Singles';
    if (newValue == 'doubles') playTypeDiv.innerHTML = 'Doubles';
}); */
eventInfoRep.on('change', (newVal) => {
    if (!newVal)
        return;
    eventUrl.innerHTML = newVal.url;
    eventName.innerHTML = newVal.name;
});
eventRep.on('change', (newVal) => {
    if (!newVal)
        return;
    playTypeDiv.innerHTML = newVal;
});
logosRep.on('change', (newVal) => {
    if (!newVal)
        return;
    if (newVal.length > 0) {
        logo.src = newVal[0].url;
    }
    else
        logo.src = 'foundry-logo.svg';
});
