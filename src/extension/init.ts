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

const tournamentRep = nodecg.Replicant<string>('tournamentUrl');
if (tournamentRep.value == undefined) tournamentRep.value = 'wt15';
const bracketRep = nodecg.Replicant<bracketMatch>('bracket');
if (bracketRep.value == undefined) bracketRep.value = {p1name: '', p2name: ''};
const losersRep = nodecg.Replicant<losersRep>('losers');
if (losersRep.value == undefined) losersRep.value = 'off';
const roundsRep = nodecg.Replicant<number | null>('rounds');
if (roundsRep.value == undefined) roundsRep.value = null;
const bracketSourceRep = nodecg.Replicant<bracketSource>('bracketSource');
if (bracketSourceRep.value == undefined) bracketSourceRep.value = 'challonge';
const scoreRep = nodecg.Replicant<scoreRep>('score');
if (scoreRep.value == undefined) scoreRep.value = [0,0];
const x32replicant = nodecg.Replicant<x32settings>('x32');
if (x32replicant.value == undefined) x32replicant.value = { commentary: [{on: false, level: 0}, {on: false, level: 0}]}