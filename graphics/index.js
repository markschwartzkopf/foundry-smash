"use strict";
/// <reference path="../../../../types/browser.d.ts" />
const PlayersNamesReplicant = nodecg.Replicant('playersnames');
let replicantGraphic = document.getElementById('name');
PlayersNamesReplicant.on('change', (newVal) => {
    replicantGraphic.innerHTML = newVal[0];
});
