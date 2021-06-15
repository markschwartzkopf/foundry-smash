/// <reference path="../../../../types/browser.d.ts" />

const playersRep = nodecg.Replicant<players>('players');
const playTypeRep = nodecg.Replicant<playType>('playType');

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

playersRep.on('change', (newVal, oldVal) => {
  let player1 = document.getElementById('player-name1')!;
	let player2 = document.getElementById('player-name2')!;
  let player3 = document.getElementById('player-name3')!;
	let player4 = document.getElementById('player-name4')!;
	player1.innerHTML = newVal[0].name;
	player1.style.backgroundColor = sColor(newVal[0].color);
	player2.innerHTML = newVal[1].name;
	player2.style.backgroundColor = sColor(newVal[1].color);
  player3.innerHTML = newVal[2].name;
	player3.style.backgroundColor = sColor(newVal[2].color);
  player4.innerHTML = newVal[3].name;
	player4.style.backgroundColor = sColor(newVal[3].color);
  if ((!oldVal || !oldVal[0].name) && newVal[0].name) player1.style.animation = 'fade-in 1000ms forwards';
  if ((!oldVal || !oldVal[1].name) && newVal[1].name) player2.style.animation = 'fade-in 1000ms forwards';
  if ((!oldVal || !oldVal[2].name) && newVal[2].name) player3.style.animation = 'fade-in 1000ms forwards';
  if ((!oldVal || !oldVal[3].name) && newVal[3].name) player4.style.animation = 'fade-in 1000ms forwards';
  if (oldVal && oldVal[0].name && !newVal[0].name) player1.style.animation = 'fade-in 1000ms reverse';
  if (oldVal && oldVal[1].name && !newVal[1].name) player2.style.animation = 'fade-in 1000ms reverse';
  if (oldVal && oldVal[2].name && !newVal[2].name) player3.style.animation = 'fade-in 1000ms reverse';
  if (oldVal && oldVal[3].name && !newVal[3].name) player4.style.animation = 'fade-in 1000ms reverse';
});

playTypeRep.on('change', (newVal) => {
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
})

//shooting stars code:
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
