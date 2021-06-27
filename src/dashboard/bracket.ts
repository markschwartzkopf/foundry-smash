/// <reference path="../../../../types/browser.d.ts" />
export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

const challongeLosersRep = nodecg.Replicant<losersRep>('challongeLosers');
const challongeRoundsRep = nodecg.Replicant<number | null>('challongeRounds');
const tournamentRep = nodecg.Replicant<string>('tournamentUrl');

let losers = document.getElementById('losers')! as HTMLInputElement;
let losersOnly = document.getElementById('losers-only')! as HTMLInputElement;
let rounds = document.getElementById('rounds')! as HTMLInputElement;
let url = document.getElementById('url')! as HTMLInputElement;
let refresh = document.getElementById('refresh')! as HTMLButtonElement;


losers.oninput = () => {
	NodeCG.waitForReplicants(challongeLosersRep).then(() => {
		if (losers.checked) {
			challongeLosersRep.value = 'on';
		} else {
			challongeLosersRep.value = 'off';
		}
	});
};

losersOnly.oninput = () => {
	NodeCG.waitForReplicants(challongeLosersRep).then(() => {
		if (losersOnly.checked) {
			challongeLosersRep.value = 'only';
		} else {
			challongeLosersRep.value = 'on';
		}
	});
};

rounds.onkeyup = (ev) => {
	if (ev.key == 'Enter') {
		let num = parseInt(rounds.value);
		if (num == NaN) {
			challongeRoundsRep.value = null;
		} else challongeRoundsRep.value = num;
	}
};

url.onkeyup = (ev) => {
	if (ev.key == 'Enter') {
		tournamentRep.value = url.value;
	}
};

refresh.onclick = () => {
  nodecg.sendMessage('updateChallongeBracket');
}

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
	} else rounds.value = '';
});

tournamentRep.on('change', (newVal) => {
	url.value = newVal;
});
