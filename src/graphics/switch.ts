import { switchAnimTrigger } from "../shared-types/shared";

console.log(window.innerWidth);
document.body.style.transform = `scale(${window.innerWidth / 1920})`;
const switchAnimTriggerRep =
	nodecg.Replicant<switchAnimTrigger>('switch-trigger');

nodecg.listenFor('toGame', () => {
	let switchBody = document.getElementById('switch-body')!;
	if (switchBody) document.body.removeChild(switchBody);
	switchBody = document.createElement('div');
	switchBody.id = 'switch-body';
	document.body.appendChild(switchBody);
});

nodecg.listenFor('resetPregame', () => {
	resetPage();
});

nodecg.listenFor('resetAll', () => {
	resetPage();
});

function resetPage() {
	let switchBody = document.getElementById('switch-body');
	let leftJoycon = document.getElementById('left-joycon');
	let rightJoycon = document.getElementById('right-joycon');
	if (switchBody) document.body.removeChild(switchBody);
	if (leftJoycon) document.body.removeChild(leftJoycon);
	if (rightJoycon) document.body.removeChild(rightJoycon);
}

switchAnimTriggerRep.on('change', (newVal) => {
	switch (newVal) {
		case 'joyconsIn':
			let leftJoycon = document.getElementById('left-joycon')!;
			let rightJoycon = document.getElementById('right-joycon')!;
			if (leftJoycon) document.body.removeChild(leftJoycon);
			if (rightJoycon) document.body.removeChild(rightJoycon);
			leftJoycon = document.createElement('div');
			rightJoycon = document.createElement('div');
			leftJoycon.id = 'left-joycon';
			rightJoycon.id = 'right-joycon';
			leftJoycon.addEventListener('animationend', () => {
				nodecg.sendMessage('bumpSwitch');
			});
			rightJoycon.addEventListener('animationend', () => {
				nodecg.sendMessage('bumpSwitch');
				setTimeout(() => {
					nodecg.sendMessage('zoomToFullscreen');
				}, 600);
			});
			document.body.appendChild(leftJoycon);
			document.body.appendChild(rightJoycon);
			break;
	}
	switchAnimTriggerRep.value = '';
});
