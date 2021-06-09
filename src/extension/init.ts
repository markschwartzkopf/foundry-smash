import { NodeCG } from "../../../../types/server";

const nodecg:NodeCG = require('./nodecg-api-context').get();
const playersRep = nodecg.Replicant<players>('players');
if (playersRep.value == undefined) playersRep.value = [{name: 'one', color: 0}, {name: 'two', color: 0}, {name: 'three', color: 0}, {name: 'four', color: 0}]
const playTypeRep = nodecg.Replicant<playType>('playType');
if (playTypeRep.value == undefined) playTypeRep.value = 'singles'