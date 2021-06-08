"use strict";
/// <reference path="../../../../types/browser.d.ts" />
const PlayersNamesReplicant = nodecg.Replicant('playersnames');
let replicantInput = document.getElementById('replicant');
let submitButton = document.getElementById('submit');
PlayersNamesReplicant.on('change', (newVal) => {
    replicantInput.value = newVal[0];
});
submitButton.onclick = () => {
    PlayersNamesReplicant.value = [replicantInput.value];
};
