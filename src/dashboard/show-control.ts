/// <reference path="../../../../types/browser.d.ts" />

document.body.style.backgroundColor = 'red';
const obsStatusRep = nodecg.Replicant<obsStatus>('obs-status');
let toGame = document.getElementById('to-game')!;
let connect = document.getElementById('connect')!;
let disconnect = document.getElementById('disconnect')!;
let resetPregame = document.getElementById('reset-pregame')!;
let obsStatusDiv = document.getElementById('obs-status')!;
nodecg.sendMessage('connect');

toGame.onclick = () => {
	nodecg.sendMessage('toGame');
};
connect.onclick = () => {
	nodecg.sendMessage('connect');
};
disconnect.onclick = () => {
	nodecg.sendMessage('disconnect');
};
resetPregame.onclick = () => {
  nodecg.sendMessage('resetPregame');
}

obsStatusRep.on('change', (newVal) => {
  if (newVal.status == 'connected') {
    document.body.style.backgroundColor = '';
  } else {
    document.body.style.backgroundColor = 'red';
  }
  obsStatusDiv.innerHTML = 'status:' + newVal.status + ' PVW:"' + newVal.preview + '" PGM:"' + newVal.program + '"';
})