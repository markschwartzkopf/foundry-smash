/// <reference path="../../../../types/browser.d.ts" />

const PlayersNamesReplicant = nodecg.Replicant <string[]> ('playersnames');

let replicantGraphic = document.getElementById('name')! as HTMLDivElement;

PlayersNamesReplicant.on('change', (newVal) => {
    replicantGraphic.innerHTML = newVal[0];
})