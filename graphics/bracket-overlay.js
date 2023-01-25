"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playTypeRep = nodecg.Replicant('playType');
const eventInfoRep = nodecg.Replicant('event-info');
const logosRep = nodecg.Replicant('assets:event-logos');
let playTypeDiv = document.getElementById('category');
let eventName = document.getElementById('header-main-text');
let eventUrl = document.getElementById('footer');
let logo = document.getElementById('corner-svg');
playTypeRep.on('change', (newValue) => {
    if (newValue == 'singles')
        playTypeDiv.innerHTML = 'Singles';
    if (newValue == 'doubles')
        playTypeDiv.innerHTML = 'Doubles';
});
eventInfoRep.on('change', (newVal) => {
    eventUrl.innerHTML = newVal.url;
    eventName.innerHTML = newVal.name;
});
logosRep.on('change', (newVal) => {
    if (newVal.length > 0) {
        logo.src = newVal[0].url;
    }
    else
        logo.src = 'foundry-logo.svg';
});
