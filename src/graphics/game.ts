/// <reference path="../../../../types/browser.d.ts" />

const playersRep2 = nodecg.Replicant<players>('players');
const playTypeRep2 = nodecg.Replicant<playType>('playType');
const switchPlayerRep = nodecg.Replicant<switchPlayer>('switchPlayer');

let oldSwitchArray: players = [
	{ name: '', color: 0 },
	{ name: '', color: 0 },
	{ name: '', color: 0 },
	{ name: '', color: 0 },
];

const smashColors2 = [
	'--smash-light-gray',
	'--smash-light-red',
	'--smash-light-blue',
	'--smash-light-green',
	'--smash-light-yellow',
];
function sColor2(num: number) {
	return 'var(' + smashColors2[num] + ')';
}

playersRep2.on('change', (newVal, oldVal) => {
	NodeCG.waitForReplicants(switchPlayerRep).then(() => {
		updatePlayerLabels(newVal, switchPlayerRep.value!);
	});
});

switchPlayerRep.on('change', (newVal, oldVal) => {
	NodeCG.waitForReplicants(playersRep2).then(() => {
		updatePlayerLabels(playersRep2.value!, newVal);
	});
});

function updatePlayerLabels(players: players, switchPlayers: switchPlayer) {
	let switchArray: players = JSON.parse(JSON.stringify(players));
	for (let x = 0; x < switchArray.length; x++) {
		switchArray[x] = players[switchPlayers[x]];
	}
	let player1 = document.getElementById('player-name1')!;
	let player2 = document.getElementById('player-name2')!;
	let player3 = document.getElementById('player-name3')!;
	let player4 = document.getElementById('player-name4')!;
	player1.innerHTML = switchArray[0].name;
	player2.innerHTML = switchArray[1].name;
	player3.innerHTML = switchArray[2].name;
	player4.innerHTML = switchArray[3].name;
	if ((!oldSwitchArray || !oldSwitchArray[0].name) && switchArray[0].name)
		player1.style.animation = 'fade-in 1000ms forwards';
	if ((!oldSwitchArray || !oldSwitchArray[1].name) && switchArray[1].name)
		player2.style.animation = 'fade-in 1000ms forwards';
	if ((!oldSwitchArray || !oldSwitchArray[2].name) && switchArray[2].name)
		player3.style.animation = 'fade-in 1000ms forwards';
	if ((!oldSwitchArray || !oldSwitchArray[3].name) && switchArray[3].name)
		player4.style.animation = 'fade-in 1000ms forwards';
	if (oldSwitchArray && oldSwitchArray[0].name && !switchArray[0].name)
		player1.style.animation = 'fade-out 1000ms forwards';
	if (oldSwitchArray && oldSwitchArray[1].name && !switchArray[1].name)
		player2.style.animation = 'fade-out 1000ms forwards';
	if (oldSwitchArray && oldSwitchArray[2].name && !switchArray[2].name)
		player3.style.animation = 'fade-out 1000ms forwards';
	if (oldSwitchArray && oldSwitchArray[3].name && !switchArray[3].name)
		player4.style.animation = 'fade-out 1000ms forwards';
	oldSwitchArray = switchArray;
}

playTypeRep2.on('change', (newVal) => {
	if (newVal == 'singles') {
		let elements = Array.from(document.getElementsByClassName('doubles'));
		elements.forEach((x) => {
			x.classList.replace('doubles', 'singles');
		});
	} else {
		let elements = Array.from(document.getElementsByClassName('singles'));
		elements.forEach((x) => {
			x.classList.replace('singles', 'doubles');
		});
	}
});
