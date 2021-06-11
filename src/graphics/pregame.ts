/// <reference path="../../../../types/browser.d.ts" />

const playersRep = nodecg.Replicant<players>('players');

const smashColors = [
	'--smash-light-gray',
	'--smash-light-red',
	'--smash-light-blue',
	'--smash-light-green',
	'--smash-light-yellow',
];
function sColor(num: number) {
	return 'var(' + smashColors[num] + ')';
}

playersRep.on('change', (newVal) => {
	let player1 = document.getElementById('player-name1')!;
	let player2 = document.getElementById('player-name2')!;
	player1.innerHTML = newVal[0].name;
	player1.style.backgroundColor = sColor(newVal[0].color);
	player2.innerHTML = newVal[1].name;
	player2.style.backgroundColor = sColor(newVal[1].color);
});

setInterval(() => {
  let gradient = document.getElementById('gradient')!
	let sky = document.createElement('div');
	sky.className = 'sky';
	sky.style.transform = 'translate(-50%, -50%) rotate(' + Math.round(Math.random() * 360) + 'deg)';
	let star = document.createElement('div');
	star.className = 'shooting-star';
	star.style.top = Math.round(Math.random() * 100) + '%';
	star.style.height = (Math.round(Math.random() * 4) + 2) + 'px';
	let duration = Math.round(Math.random() * 7000) + 1500;
	star.style.animation = 'shooting ' + duration + 'ms forwards';
	sky.appendChild(star);
	gradient.appendChild(sky);
	setTimeout(() => {
    gradient.removeChild(sky);
  }, duration + 1000);
}, 700);
