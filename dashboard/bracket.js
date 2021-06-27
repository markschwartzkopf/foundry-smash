"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const challongeLosersRep = nodecg.Replicant('challongeLosers');
const challongeRoundsRep = nodecg.Replicant('challongeRounds');
const tournamentRep = nodecg.Replicant('tournamentUrl');
let losers = document.getElementById('losers');
let losersOnly = document.getElementById('losers-only');
let rounds = document.getElementById('rounds');
let url = document.getElementById('url');
let refresh = document.getElementById('refresh');
losers.oninput = () => {
    NodeCG.waitForReplicants(challongeLosersRep).then(() => {
        if (losers.checked) {
            challongeLosersRep.value = 'on';
        }
        else {
            challongeLosersRep.value = 'off';
        }
    });
};
losersOnly.oninput = () => {
    NodeCG.waitForReplicants(challongeLosersRep).then(() => {
        if (losersOnly.checked) {
            challongeLosersRep.value = 'only';
        }
        else {
            challongeLosersRep.value = 'on';
        }
    });
};
rounds.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        let num = parseInt(rounds.value);
        if (num == NaN) {
            challongeRoundsRep.value = null;
        }
        else
            challongeRoundsRep.value = num;
    }
};
url.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        tournamentRep.value = url.value;
    }
};
refresh.onclick = () => {
    nodecg.sendMessage('updateChallongeBracket');
};
challongeLosersRep.on('change', (newVal) => {
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
challongeRoundsRep.on('change', (newVal) => {
    if (newVal != null) {
        rounds.value = newVal.toString();
    }
    else
        rounds.value = '';
});
tournamentRep.on('change', (newVal) => {
    url.value = newVal;
});
