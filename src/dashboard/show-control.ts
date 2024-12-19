/// <reference path="../../node_modules/@nodecg/types/augment-window.d.ts" />

import { obsStatus } from "../shared-types/shared";

document.body.style.backgroundColor = 'red';
const obsStatusRep = nodecg.Replicant<obsStatus>('obs-status');
let toGame = document.getElementById('to-game')!;
let gameStart = document.getElementById('game-start')!;
let connect = document.getElementById('connect')!;
let disconnect = document.getElementById('disconnect')!;
let resetPregame = document.getElementById('reset-pregame')!;
let obsStatusDiv = document.getElementById('obs-status')!;
let updateBracket = document.getElementById('update-bracket')!;
nodecg.sendMessage('connect');

toGame.onclick = () => {
	nodecg.sendMessage('toGame');
};
gameStart.onclick = () => {
  nodecg.sendMessage('gameStart');
}
connect.onclick = () => {
	nodecg.sendMessage('connect');
};
disconnect.onclick = () => {
	nodecg.sendMessage('disconnect');
};
resetPregame.onclick = () => {
  nodecg.sendMessage('resetPregame');
}

updateBracket.onclick = () => {
  nodecg.sendMessage('updateBracket');
}


obsStatusRep.on('change', (newVal) => {
  if (!newVal) return;
  if (newVal.status == 'connected') {
    document.body.style.backgroundColor = '';
  } else {
    document.body.style.backgroundColor = 'red';
  }
  obsStatusDiv.innerHTML = 'status:' + newVal.status + ' PVW:"' + newVal.preview + '" PGM:"' + newVal.program + '"';
})