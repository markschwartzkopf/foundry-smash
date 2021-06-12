/// <reference path="../../../../types/browser.d.ts" />

document.body.style.backgroundColor = 'red';
const obsStatusRep = nodecg.Replicant<obsStatus>('obs-status');
let toGame = document.getElementById('to-game')!;
let connect = document.getElementById('connect')!;
let disconnect = document.getElementById('disconnect')!;
let resetToPregame = document.getElementById('reset-to-pregame')!;
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
resetToPregame.onclick = () => {
  nodecg.sendMessage('resetToPregame');
}

obsStatusRep.on('change', (newVal) => {
  if (newVal.status == 'connected') {
    document.body.style.backgroundColor = '';
  } else {
    document.body.style.backgroundColor = 'red';
  }
})