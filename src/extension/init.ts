import { NodeCG } from '../../../../types/server';
const nodecg: NodeCG = require('./nodecg-api-context').get();

const playersRep = nodecg.Replicant<players>('players');
if (playersRep.value == undefined)
	playersRep.value = [
		{ name: 'one', color: 0 },
		{ name: 'two', color: 0 },
		{ name: 'three', color: 0 },
		{ name: 'four', color: 0 },
	];
const playTypeRep = nodecg.Replicant<playType>('playType');
if (playTypeRep.value == undefined) playTypeRep.value = 'singles';
const cameraRep = nodecg.Replicant<cameras>('camera');
if (cameraRep.value == undefined) {
	let basicCam: camera = {
		target: { x: 1, y: 1 },
		source: { x: 1, y: 1 },
		crop: { left: 0, right: 0, top: 0, bottom: 0 },
		scale: 1,
		width: 1,
	};
	let basicScene: sceneCameras = {
		player1: basicCam,
		player2: basicCam,
		team1: basicCam,
		team2: basicCam,
	};
	let starterValue: cameras = { game: basicScene, preGame: basicScene };
	cameraRep.value = JSON.parse(JSON.stringify(starterValue));
}
const mirrorRep = nodecg.Replicant<camMirrored>('mirror');
if (mirrorRep.value == undefined) mirrorRep.value = { cam1: true, cam2: true };
const switchPlayerRep = nodecg.Replicant<switchPlayer>('switchPlayer');
if (switchPlayerRep.value == undefined) switchPlayerRep.value = [0, 1, 2, 3];
