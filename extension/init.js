"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodecg = require('./nodecg-api-context').get();
const playersRep = nodecg.Replicant('players');
if (playersRep.value == undefined)
    playersRep.value = [
        { name: 'one', color: 0 },
        { name: 'two', color: 0 },
        { name: 'three', color: 0 },
        { name: 'four', color: 0 },
    ];
const playTypeRep = nodecg.Replicant('playType');
if (playTypeRep.value == undefined)
    playTypeRep.value = 'singles';
const cameraRep = nodecg.Replicant('camera');
const mirrorRep = nodecg.Replicant('mirror', { defaultValue: { cam1: false, cam2: false } });
if (cameraRep.value == undefined) {
    const basicCam = {
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
    const basicScene = {
        cam1: basicCam,
        cam2: JSON.parse(JSON.stringify(basicCam)),
    };
    const starterValue = {
        game: basicScene,
        preGame: JSON.parse(JSON.stringify(basicScene)),
    };
    cameraRep.value = JSON.parse(JSON.stringify(starterValue));
}
const switchPlayerRep = nodecg.Replicant('switchPlayer');
if (switchPlayerRep.value == undefined)
    switchPlayerRep.value = [0, 1, 2, 3];
const tournamentRep = nodecg.Replicant('tournamentUrl');
if (tournamentRep.value == undefined)
    tournamentRep.value = 'wt15';
const bracketRep = nodecg.Replicant('bracket');
if (bracketRep.value == undefined)
    bracketRep.value = { p1name: '', p2name: '' };
const losersRep = nodecg.Replicant('losers');
if (losersRep.value == undefined)
    losersRep.value = 'off';
const roundsRep = nodecg.Replicant('rounds');
if (roundsRep.value == undefined)
    roundsRep.value = null;
const bracketSourceRep = nodecg.Replicant('bracketSource');
if (bracketSourceRep.value == undefined)
    bracketSourceRep.value = 'challonge';
const scoreRep = nodecg.Replicant('score');
if (scoreRep.value == undefined)
    scoreRep.value = [0, 0];
const x32replicant = nodecg.Replicant('x32');
if (x32replicant.value == undefined)
    x32replicant.value = {
        commentary: [
            { on: false, level: 0 },
            { on: false, level: 0 },
        ],
    };
const eventInfoRep = nodecg.Replicant('event-info');
if (eventInfoRep.value == undefined)
    eventInfoRep.value = { name: '', url: '' };
const damageTracking = nodecg.Replicant('damage-tracking');
if (damageTracking.value == undefined)
    damageTracking.value = false;
const twitchChannel = nodecg.Replicant('twitch-channel');
if (twitchChannel.value == undefined)
    twitchChannel.value = 'thefoundrycoffeehouse';
