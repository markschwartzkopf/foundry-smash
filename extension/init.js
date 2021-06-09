"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodecg = require('./nodecg-api-context').get();
const playersRep = nodecg.Replicant('players');
if (playersRep.value == undefined)
    playersRep.value = [{ name: 'one', color: 0 }, { name: 'two', color: 0 }, { name: 'three', color: 0 }, { name: 'four', color: 0 }];
const playTypeRep = nodecg.Replicant('playType');
if (playTypeRep.value == undefined)
    playTypeRep.value = 'singles';
