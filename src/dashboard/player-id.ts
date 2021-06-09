/// <reference path="../../../../types/browser.d.ts" />

const playersRep = nodecg.Replicant<players>('players');
const playTypeRep = nodecg.Replicant<playType>('playType');

const smash_colors = [
	'--smash_gray',
	'--smash_red',
	'--smash_blue',
	'--smash_green',
	'--smash_yellow',
];

function drawInputArea(players: players, type: playType) {
	let inputArea = document.getElementById('input-area')! as HTMLDivElement;
	inputArea.innerHTML = '';
	let inputNumber: 2 | 4 = 2;
	if (type == 'doubles') inputNumber = 4;
	let playersDiv = document.createElement('div');
	playersDiv.id = 'players';
	for (let x = 0; x < inputNumber; x++) {
		let playerDiv = document.createElement('div');
    let playerInput = document.createElement('input');
		playerInput.id = 'player-' + x;
		playerInput.value = players[x].name;
    playerInput.className = 'player-input';
    playerDiv.appendChild(playerInput);
    let colorDiv = document.createElement('div');
    colorDiv.className = 'color-select'
    for (let x = 1; x <= inputNumber; x++) {
      let colorSelector = document.createElement('input');
      colorSelector.type = 'checkbox';
      colorSelector.className = 'color-checkbox';
      colorSelector.style.backgroundColor = 'var('+smash_colors[x]+')';
      //colorSelector.style.backgroundColor
      colorDiv.appendChild(colorSelector);
    }
    playerDiv.appendChild(colorDiv);
		playersDiv.appendChild(playerDiv);
	}
  inputArea.appendChild(playersDiv);
}

playTypeRep.on('change', (newVal) => {
	NodeCG.waitForReplicants(playersRep).then(() => {
    drawInputArea(playersRep.value!, newVal)
  });
});
