"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const losersRep = nodecg.Replicant('losers');
const roundsRep = nodecg.Replicant('rounds');
const tournamentRep = nodecg.Replicant('tournamentUrl');
const bracketSourceRep = nodecg.Replicant('bracketSource');
let losers = document.getElementById('losers');
let losersOnly = document.getElementById('losers-only');
let rounds = document.getElementById('rounds');
let url = document.getElementById('url');
let refresh = document.getElementById('refresh');
let source = document.getElementById('source');
source.oninput = () => {
    if (source.checked) {
        bracketSourceRep.value = 'smashgg';
    }
    else
        bracketSourceRep.value = 'challonge';
};
losers.oninput = () => {
    NodeCG.waitForReplicants(losersRep).then(() => {
        if (losers.checked) {
            losersRep.value = 'on';
        }
        else {
            losersRep.value = 'off';
        }
    });
};
losersOnly.oninput = () => {
    NodeCG.waitForReplicants(losersRep).then(() => {
        if (losersOnly.checked) {
            losersRep.value = 'only';
        }
        else {
            losersRep.value = 'on';
        }
    });
};
rounds.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        let num = parseInt(rounds.value);
        if (Number.isNaN(num)) {
            roundsRep.value = null;
        }
        else
            roundsRep.value = num;
    }
};
url.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        tournamentRep.value = url.value;
    }
};
refresh.onclick = () => {
    nodecg.sendMessage('updateBracket');
};
losersRep.on('change', (newVal) => {
    switch (newVal) {
        case 'off':
            losers.checked = false;
            losersOnly.checked = false;
            break;
        case 'on':
            losers.checked = true;
            losersOnly.checked = false;
            break;
        case 'only':
            losers.checked = true;
            losersOnly.checked = true;
            break;
    }
});
roundsRep.on('change', (newVal) => {
    if (newVal != null) {
        rounds.value = newVal.toString();
    }
    else
        rounds.value = '';
});
tournamentRep.on('change', (newVal) => {
    url.value = newVal;
});
bracketSourceRep.on('change', (newVal) => {
    if (newVal == 'smashgg') {
        source.checked = true;
    }
    else
        source.checked = false;
});
