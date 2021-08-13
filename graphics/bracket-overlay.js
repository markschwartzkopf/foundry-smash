"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playTypeRep = nodecg.Replicant('playType');
let playTypeDiv = document.getElementById('category');
playTypeRep.on('change', (newValue) => {
    if (newValue == 'singles')
        playTypeDiv.innerHTML = 'Singles';
    if (newValue == 'doubles')
        playTypeDiv.innerHTML = 'Doubles';
});
