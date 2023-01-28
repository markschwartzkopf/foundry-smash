import { json } from 'body-parser';
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
	const basicCam: camera = {
		targets: {
			doubles: { positionX: 1, positionY: 1, width: 1, height: 1 },
			singles: { positionX: 1, positionY: 1, width: 1, height: 1 },
		},
		source: {
			sourceWidth: 1,
			sourceHeight: 1,
			scaleX: 1,
			cropTop: 0,
			cropBottom: 0,
			cropLeft: 0,
			cropRight: 0,
		},
	};
	const basicScene: sceneCameras = {
		cam1: basicCam,
		cam2: JSON.parse(JSON.stringify(basicCam)),
	};
	const starterValue: cameras = {
		game: basicScene,
		preGame: JSON.parse(JSON.stringify(basicScene)),
	};
	cameraRep.value = JSON.parse(JSON.stringify(starterValue));
}

const switchPlayerRep = nodecg.Replicant<switchPlayer>('switchPlayer');
if (switchPlayerRep.value == undefined) switchPlayerRep.value = [0, 1, 2, 3];

const tournamentRep = nodecg.Replicant<string>('tournamentUrl');
if (tournamentRep.value == undefined) tournamentRep.value = 'wt15';
const bracketRep = nodecg.Replicant<bracketMatch>('bracket');
if (bracketRep.value == undefined)
	bracketRep.value = { p1name: '', p2name: '' };
const losersRep = nodecg.Replicant<losersRep>('losers');
if (losersRep.value == undefined) losersRep.value = 'off';
const roundsRep = nodecg.Replicant<number | null>('rounds');
if (roundsRep.value == undefined) roundsRep.value = null;
const bracketSourceRep = nodecg.Replicant<bracketSource>('bracketSource');
if (bracketSourceRep.value == undefined) bracketSourceRep.value = 'challonge';
const scoreRep = nodecg.Replicant<scoreRep>('score');
if (scoreRep.value == undefined) scoreRep.value = [0, 0];
const x32replicant = nodecg.Replicant<x32settings>('x32');
if (x32replicant.value == undefined)
	x32replicant.value = {
		commentary: [
			{ on: false, level: 0 },
			{ on: false, level: 0 },
		],
	};
const eventInfoRep = nodecg.Replicant<EventInfo>('event-info');
if (eventInfoRep.value == undefined) eventInfoRep.value = { name: '', url: '' };
const damageTracking = nodecg.Replicant<boolean>('damage-tracking');
if (damageTracking.value == undefined) damageTracking.value = false;
const twitchChannel = nodecg.Replicant<string>('twitch-channel');
if (twitchChannel.value == undefined) twitchChannel.value = 'thefoundrycoffeehouse'