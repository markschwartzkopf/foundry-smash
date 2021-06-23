/// <reference path="../../../../types/browser.d.ts" />
export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML
const playersRep = nodecg.Replicant<players>('players');
const playTypeRep = nodecg.Replicant<playType>('playType');
const mirrorRep = nodecg.Replicant<camMirrored>('mirror');
const switchPlayerRep = nodecg.Replicant<switchPlayer>('switchPlayer');

let oldSwitchArray: players = [
	{ name: '', color: 0 },
	{ name: '', color: 0 },
	{ name: '', color: 0 },
	{ name: '', color: 0 },
];

const smashColors = [
	'--smash-gray',
	'--smash-red',
	'--smash-blue',
	'--smash-green',
	'--smash-yellow',
];

const root = document.documentElement;
let bannersDiv = document.getElementById('banner-shadow-hide')!;
let namesDiv = document.getElementById('name-hide')!;
let score1 = document.getElementById('score1')!;
let score2 = document.getElementById('score2')!;
let player1 = document.getElementById('player-name1')!;
let player2 = document.getElementById('player-name2')!;
let player3 = document.getElementById('player-name3')!;
let player4 = document.getElementById('player-name4')!;

function sColor(num: number) {
	return 'var(' + smashColors[num] + ')';
}

mirrorRep.on('change', (newVal, oldVal) => {
	NodeCG.waitForReplicants(
		playersRep,
		switchPlayerRep,
		playTypeRep,
		mirrorRep
	).then(() => {
		setNamesAndColors(
			playersRep.value!,
			switchPlayerRep.value!,
			playTypeRep.value!,
			newVal
		);
	});
});

playersRep.on('change', (newVal, oldVal) => {
	NodeCG.waitForReplicants(switchPlayerRep, playTypeRep, mirrorRep).then(() => {
		setNamesAndColors(
			newVal,
			switchPlayerRep.value!,
			playTypeRep.value!,
			mirrorRep.value!
		);
	});
});

switchPlayerRep.on('change', (newVal, oldVal) => {
	NodeCG.waitForReplicants(playersRep).then(() => {
		setNamesAndColors(
			playersRep.value!,
			newVal,
			playTypeRep.value!,
			mirrorRep.value!
		);
	});
});

function setNamesAndColors(
	players: players,
	switchPlayers: switchPlayer,
	type: playType,
	mirror: camMirrored
) {
	let name1 = document.getElementById('name1');
	let name2 = document.getElementById('name2');
	if (name1 && name2) {
		name1.style.transform = '';
		name2.style.transform = '';
		root.style.setProperty('--banner1', sColor(players[0].color));
		if (type == 'singles') {
			root.style.setProperty('--banner2', sColor(players[1].color));
			name1.innerHTML = players[0].name;
			name2.innerHTML = players[1].name;
		} else {
			root.style.setProperty('--banner2', sColor(players[2].color));
			if (mirror.cam1) {
				name1.innerHTML = players[0].name + ' & ' + players[1].name;
			} else name1.innerHTML = players[1].name + ' & ' + players[0].name;
			if (mirror.cam2) {
				name2.innerHTML = players[2].name + ' & ' + players[3].name;
			} else name2.innerHTML = players[3].name + ' & ' + players[2].name;
		}
		let width1 = name1.clientWidth;
		let right1 = name1.getBoundingClientRect().right;
		let width2 = name2.clientWidth;
		let left2 = name2.getBoundingClientRect().left;
		if (width1 > 280) {
			let scaleFactor1 = Math.round((280 * 100) / width1) / 100;
			name1.style.transform = 'scaleX(' + scaleFactor1 + ')';
			name1.style.transform =
				'scaleX(' +
				scaleFactor1 +
				') translateX(' +
				(right1 - name1.getBoundingClientRect().right) * (1 / scaleFactor1) +
				'px)';
		}
		if (width2 > 280) {
			let scaleFactor2 = Math.round((280 * 100) / width2) / 100;
			name2.style.transform = 'scaleX(' + scaleFactor2 + ')';
			name2.style.transform =
				'scaleX(' +
				scaleFactor2 +
				') translateX(' +
				(left2 - name2.getBoundingClientRect().left) * (1 / scaleFactor2) +
				'px)';
		}
	}

	let switchArray: players = JSON.parse(JSON.stringify(players));
	for (let x = 0; x < switchArray.length; x++) {
		switchArray[x] = players[switchPlayers[x]];
	}

	if (player1 && player2 && player3 && player4) {
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
}

playTypeRep.on('change', (newVal) => {
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
	NodeCG.waitForReplicants(playersRep, mirrorRep, switchPlayerRep).then(() => {
		setNamesAndColors(
			playersRep.value!,
			switchPlayerRep.value!,
			newVal,
			mirrorRep.value!
		);
	});
});

nodecg.listenFor('zeroGame', () => {
	zeroGame();
});

nodecg.listenFor('gameOverlayIn', () => {
	zeroGame();
	bannersDiv.style.animation = 'banner-in 500ms forwards';
  namesDiv.style.animation = 'name-in 500ms 500ms forwards';
  score1.style.animation = 'score-in 200ms cubic-bezier(0.76, 0.18, 0.96, 1.39) 1000ms forwards';
  score2.style.animation = 'score-in 200ms cubic-bezier(0.76, 0.18, 0.96, 1.39) 1000ms forwards';
  player1.style.animation = 'fade-in 1000ms 1000ms forwards';
  player2.style.animation = 'fade-in 1000ms 1000ms forwards';
  player3.style.animation = 'fade-in 1000ms 1000ms forwards';
  player4.style.animation = 'fade-in 1000ms 1000ms forwards';
});

function zeroGame() {
	[player1, player2, player3, player4, bannersDiv, namesDiv, score1, score2].forEach((element) => {
		element.style.animation = 'unset';
	});
}
