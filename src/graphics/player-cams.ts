/// <reference path="../../../../types/browser.d.ts" />

const playersRep3 = nodecg.Replicant<players>('players');
const playTypeRep3 = nodecg.Replicant<playType>('playType');
const mirrorRep3 = nodecg.Replicant<camMirrored>('mirror');
const smashColorsLight = [
	'--smash-light-gray',
	'--smash-light-red',
	'--smash-light-blue',
	'--smash-light-green',
	'--smash-light-yellow',
];
const smashColors3 = [
	'--smash-gray',
	'--smash-red',
	'--smash-blue',
	'--smash-green',
	'--smash-yellow',
];
const root = document.documentElement;

function sColor3(num: number, light?: 'light') {
	if (!light) {
		return 'var(' + smashColors3[num] + ')';
	} else return 'var(' + smashColorsLight[num] + ')';
}

playersRep3.on('change', (newVal, oldVal) => {
	NodeCG.waitForReplicants(playTypeRep3, mirrorRep3).then(() => {
		setNamesandColors(newVal, playTypeRep3.value!, mirrorRep3.value!);
	});
});

mirrorRep3.on('change', (newVal, oldVal) => {
	NodeCG.waitForReplicants(playersRep3, playTypeRep3).then(() => {
		setNamesandColors(playersRep3.value!, playTypeRep3.value!, newVal);
	});
});

playTypeRep3.on('change', (newVal) => {
  if (newVal == 'singles') {
    let elements = Array.from(document.getElementsByClassName('doubles'));
    elements.forEach((x) => {
      x.classList.replace('doubles', 'singles')
    })
  } else {
    let elements = Array.from(document.getElementsByClassName('singles'));
    elements.forEach((x) => {
      x.classList.replace('singles', 'doubles')
    })
  }
	NodeCG.waitForReplicants(playersRep3, mirrorRep3).then(() => {
		setNamesandColors(playersRep3.value!, newVal, mirrorRep3.value!);
	});
});

function setNamesandColors(players: players, type: playType, mirror: camMirrored) {
	let name1 = document.getElementById('name1')!;
	let name2 = document.getElementById('name2')!;
	name1.style.transform = '';
  name2.style.transform = '';
	root.style.setProperty('--banner1', sColor3(players[0].color));
	if (type == 'singles') {
		root.style.setProperty('--banner2', sColor3(players[1].color));
		name1.innerHTML = players[0].name;
		name2.innerHTML = players[1].name;
	} else {
		root.style.setProperty('--banner2', sColor3(players[2].color));
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
    name1.style.transform =
    'scaleX(' + scaleFactor1 + ')';
		name1.style.transform =
    'scaleX(' + scaleFactor1 + ') translateX(' + ((right1 - name1.getBoundingClientRect().right) * (1/scaleFactor1)) + 'px)'
	}
  if (width2 > 280) {
		let scaleFactor2 = Math.round((280 * 100) / width2) / 100;
		name2.style.transform =
    'scaleX(' + scaleFactor2 + ')';
		name2.style.transform =
    'scaleX(' + scaleFactor2 + ') translateX(' + ((left2 - name2.getBoundingClientRect().left) * (1/scaleFactor2)) + 'px)'
	}
}
