"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const nodecg = require('./nodecg-api-context').get();
const tournamentRep = nodecg.Replicant('tournamentUrl'); //ie 'tournament/whos-tyler-11-100-pot-bonus/event/ultimate-singles' for smash.gg or 'wt15' for challonge
const bracketRep = nodecg.Replicant('bracket');
const bracketSourceRep = nodecg.Replicant('bracketSource');
let playerIds = {};
function hasChallongeKey(bundleConfig) {
    const bc = bundleConfig;
    return !!bc && typeof bc.challongeKey === 'string';
}
function hasSmashggKey(bundleConfig) {
    const bc = bundleConfig;
    return !!bc && typeof bc.smashggKey === 'string';
}
const challongeApiKey = hasChallongeKey(nodecg.bundleConfig) ? nodecg.bundleConfig.challongeKey : '';
const smashggApiKey = hasSmashggKey(nodecg.bundleConfig) ? nodecg.bundleConfig.smashggKey : '';
const challongeApiUrl = 'https://api.challonge.com/v1/';
const smashggApiUrl = 'https://api.start.gg/gql/alpha';
function ChallongeMethodUrl(method) {
    return challongeApiUrl + 'tournaments/' + tournamentRep.value + '/' + method + '.json?api_key=' + challongeApiKey;
}
if (bracketSourceRep.value == 'challonge') {
    pullFromChallonge();
}
else
    pullFromSmashgg();
nodecg.listenFor('updateBracket', () => {
    if (bracketSourceRep.value == 'challonge') {
        pullFromChallonge();
    }
    else
        pullFromSmashgg();
});
//let slug = 'tournament/whos-tyler-11-100-pot-bonus/event/ultimate-singles';
function smashggFetch(query, slug) {
    const queryString = slug
        ? JSON.stringify({
            query: '{event(slug: "' + slug + '")' + query + '}',
        })
        : JSON.stringify({
            query: query,
        });
    return new Promise((res, rej) => {
        (0, node_fetch_1.default)(smashggApiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + smashggApiKey,
            },
            body: queryString,
        })
            .then((resp) => {
            return resp.json();
        })
            .then((resp) => {
            if (resp.errors) {
                rej(resp.errors);
            }
            else if (resp.errorId !== undefined) {
                rej({ message: resp.message, errorId: resp.errorId });
            }
            else
                res(resp.data);
        })
            .catch((err) => {
            rej(err);
        });
    });
}
function pullFromSmashgg() {
    getSmashggParticipants()
        .then((resp) => {
        playerIds = resp;
        nodecg.log.info('Players pulled from smash.gg');
        //return getSmashggMatches();
        return getSmasgGGPhases();
    })
        .then((resp) => {
        nodecg.log.info('Bracket info pulled from smash.gg');
        bracketRep.value = resp;
    })
        .catch((err) => {
        myError(err);
    });
}
function pullFromChallonge() {
    getChallongeParticipants()
        .then((resp) => {
        playerIds = resp;
        return getChallongeMatches();
    })
        .then((resp) => {
        bracketRep.value = resp;
    })
        .catch((err) => {
        myError(err);
    });
}
function getSmashggParticipants() {
    return new Promise((res, rej) => {
        let rtn = {};
        let smashParticipantQuery = '{entrants(query: {perPage: 500}){nodes{id name participants{gamerTag}}}}';
        smashggFetch(smashParticipantQuery, tournamentRep.value)
            .then((resp) => {
            if (resp &&
                resp.event &&
                resp.event.entrants &&
                resp.event.entrants.nodes &&
                Array.isArray(resp.event.entrants.nodes)) {
                let playerArray = resp.event.entrants.nodes;
                playerArray.forEach((x) => {
                    let id = x.id;
                    let name = x.name;
                    if (x.participants && x.participants[0] && x.participants[0].gamerTag) {
                        name = x.participants[0].gamerTag;
                        if (x.participants[1] && x.participants[1].gamerTag) {
                            name = name + ' & ' + x.participants[1].gamerTag;
                        }
                    }
                    if (typeof id == 'number' && typeof name == 'string') {
                        rtn[id.toString()] = name;
                    }
                    else
                        rej('Bad data from Challonge');
                });
                res(rtn);
            }
            else {
                nodecg.log.info(JSON.stringify(resp, null, 2));
                rej('Bad participant data from smash.gg');
            }
        })
            .catch((err) => {
            rej(err);
        });
    });
}
function getChallongeParticipants() {
    return new Promise((res, rej) => {
        let rtn = {};
        (0, node_fetch_1.default)(ChallongeMethodUrl('participants'), { method: 'GET' })
            .then((resp) => {
            return resp.json();
        })
            .then((resp) => {
            if (Array.isArray(resp)) {
                let playerArray = resp;
                playerArray.forEach((x) => {
                    let id = x.participant?.id;
                    let name = x.participant?.display_name;
                    if (typeof id == 'number' && typeof name == 'string') {
                        rtn[id.toString()] = name;
                    }
                    else
                        rej('Bad data from Challonge');
                });
                res(rtn);
            }
            else {
                rej('Bad data from Challonge: Not an array');
            }
        })
            .catch((err) => {
            rej(err);
        });
    });
}
function getChallongeMatches() {
    return new Promise((res, rej) => {
        (0, node_fetch_1.default)(ChallongeMethodUrl('matches'), { method: 'GET' })
            .then((resp) => {
            return resp.json();
        })
            .then((resp) => {
            let rtn;
            if (Array.isArray(resp)) {
                let matchArray = resp;
                let highRound = 0;
                let highRoundMatch;
                let finalFinalMatch;
                let matchIndex = {};
                matchArray.forEach((x) => {
                    let match = {
                        id: x.match?.id,
                        player1_id: x.match?.player1_id,
                        player2_id: x.match?.player2_id,
                        player1_prereq_match_id: x.match?.player1_prereq_match_id,
                        player2_prereq_match_id: x.match?.player2_prereq_match_id,
                        player1_is_prereq_match_loser: x.match?.player1_is_prereq_match_loser,
                        player2_is_prereq_match_loser: x.match?.player2_is_prereq_match_loser,
                        winner_id: x.match?.winner_id,
                        loser_id: x.match?.loser_id,
                        round: x.match?.round,
                    };
                    if (typeof match.id == 'number' &&
                        (typeof match.player1_id == 'number' || match.player1_id == null) &&
                        (typeof match.player2_id == 'number' || match.player2_id == null) &&
                        (typeof match.player1_prereq_match_id == 'number' || match.player1_prereq_match_id == null) &&
                        (typeof match.player2_prereq_match_id == 'number' || match.player2_prereq_match_id == null) &&
                        typeof match.player1_is_prereq_match_loser == 'boolean' &&
                        typeof match.player2_is_prereq_match_loser == 'boolean' &&
                        (typeof match.winner_id == 'number' || match.winner_id == null) &&
                        (typeof match.loser_id == 'number' || match.loser_id == null) &&
                        typeof match.round == 'number') {
                        if (match.player1_id && playerIds[match.player1_id.toString()])
                            match.player1_name = playerIds[match.player1_id.toString()];
                        if (match.player2_id && playerIds[match.player2_id.toString()])
                            match.player2_name = playerIds[match.player2_id.toString()];
                        let score = x.match?.scores_csv;
                        if (typeof score == 'string') {
                            let p1 = score.split('-')[0];
                            let p2 = score.split('-')[1];
                            if (p1 && p2) {
                                match.score = { p1: parseInt(p1), p2: parseInt(p2) };
                            }
                        }
                        else
                            rej('Bad data from Challonge');
                        matchIndex[match.id.toString()] = match;
                        if (match.round == highRound)
                            highRoundMatch = match;
                        if (match.round > highRound) {
                            highRound = match.round;
                            highRoundMatch = match;
                        }
                    }
                    else
                        rej('Bad data from Challonge');
                    if (match.player1_prereq_match_id &&
                        match.player2_prereq_match_id &&
                        match.player1_prereq_match_id == match.player2_prereq_match_id) {
                        finalFinalMatch = match;
                        highRoundMatch = matchIndex[match.player1_prereq_match_id];
                    }
                });
                if (highRoundMatch) {
                    if (finalFinalMatch && finalFinalMatch.winner_id)
                        highRoundMatch.winner_id = finalFinalMatch?.winner_id;
                    rtn = populateBracket(highRoundMatch, matchIndex);
                    res(rtn);
                }
                else {
                    rej('Bad data from Challonge');
                }
            }
            else {
                rej('Bad data from Challonge: Not an array');
            }
        })
            .catch((err) => {
            rej(err);
        });
    });
}
function getSmasgGGPhases() {
    return new Promise((res, rej) => {
        let smashPhaseQuery = '{phases{id name}}';
        const matches = {};
        const seeds = {};
        const phaseInfo = {};
        smashggFetch(smashPhaseQuery, tournamentRep.value)
            .then((resp) => {
            if (resp &&
                resp.event &&
                resp.event.phases &&
                Array.isArray(resp.event.phases) &&
                resp.event.phases.every((x) => typeof x.id == 'number' && typeof x.name == 'string')) {
                let phaseArray = resp.event.phases;
                Promise.all(phaseArray.map((x) => {
                    return getSmashggPhaseMatches(x.id);
                }))
                    .then((phaseMatches) => {
                    phaseMatches.forEach((phase) => {
                        phase.forEach((match) => {
                            if (isSmashggApiMatch(match)) {
                                matches[String(match.id)] = match;
                                const phaseGroupId = String(match.phaseGroup.id);
                                if (!phaseInfo[phaseGroupId]) {
                                    phaseInfo[phaseGroupId] = {
                                        lastWinnerRound: 0,
                                        lastLoserRound: 0,
                                        placements: {},
                                        allMatches: [],
                                    };
                                }
                                const thisPhaseInfo = phaseInfo[phaseGroupId];
                                thisPhaseInfo.allMatches.push(match);
                                if (match.round > thisPhaseInfo.lastWinnerRound) {
                                    thisPhaseInfo.lastWinnerRound = match.round;
                                }
                                if (match.round < thisPhaseInfo.lastLoserRound) {
                                    thisPhaseInfo.lastLoserRound = match.round;
                                }
                            }
                            else
                                rej('Bad start.gg match');
                        });
                    });
                    console.log(`Phase match data received: ${Object.keys(matches).length} matches`);
                    return Promise.all(phaseArray.map((x) => {
                        return getSmashggPhaseSeeds(x.id);
                    }));
                })
                    .then((phaseSeeds) => {
                    phaseSeeds.forEach((phase) => {
                        phase.forEach((seed) => {
                            if (isSmashggApiSeed(seed)) {
                                seeds[String(seed.id)] = seed;
                            }
                            else
                                rej('Bad start.gg seed');
                        });
                    });
                    function seedCompare(a, b) {
                        return b.round - a.round + 1 / (a.seed - b.seed);
                    }
                    function getHighestSeed(match, losers, koRound) {
                        if (!koRound)
                            koRound = null;
                        if (match.round > 0 && losers)
                            koRound = match.round;
                        const seedNums = [];
                        match.slots.forEach((slot, index) => {
                            if (slot.prereqType === 'seed') {
                                const seed = seeds[String(slot.prereqId)];
                                if (seed) {
                                    seedNums[index] = { seed: seed.seedNum, round: koRound || 0 };
                                    //if (match.round < 0) console.log(`Loser match with seed ${seed} found`);
                                }
                            }
                            else {
                                const prereqMatch = matches[String(slot.prereqId)];
                                if (prereqMatch) {
                                    seedNums[index] = getHighestSeed(prereqMatch, match.round < 0, koRound);
                                }
                                else if (slot.seed && typeof slot.seed.seedNum === 'number') {
                                    seedNums[index] = { seed: slot.seed.seedNum, round: koRound || 0 };
                                    //if (match.round < 0) console.log(`Loser match with attached seed ${slot.seed} found`);
                                }
                                else if (!slot.prereqId && slot.prereqType === 'bye') {
                                    //console.log(`Bye match with no prereqId found for match ${match.id}`);
                                }
                                else {
                                    console.log(`No seed match for match ${match.id}, looking for seed ${slot.prereqId}`);
                                    console.log(slot);
                                }
                            }
                        });
                        const nums = seedNums.filter((x) => typeof x.seed === 'number' && !isNaN(x.seed));
                        if (nums.length > 0) {
                            nums.sort(seedCompare);
                            //console.log('higher rank:' + JSON.stringify(nums[0]));
                            //console.log('lower rank:' + JSON.stringify(nums[1]));
                            return nums[0];
                        }
                        return { seed: NaN, round: 0 };
                    }
                    Object.entries(phaseInfo).forEach(([phaseGroupId, phase]) => {
                        phase.allMatches.forEach((match) => {
                            if ((match.round === phase.lastWinnerRound || match.round === phase.lastLoserRound) &&
                                match.wPlacement !== null) {
                                const placement = match.wPlacement.toString();
                                if (!phase.placements[placement])
                                    phase.placements[placement] = [];
                                phase.placements[placement].push(match);
                            }
                        });
                        Object.entries(phase.placements).forEach(([placement, matches]) => {
                            matches.sort((a, b) => {
                                const seedA = getHighestSeed(a);
                                const seedB = getHighestSeed(b);
                                if (seedA.round)
                                    return seedCompare(seedB, seedA);
                                return seedCompare(seedA, seedB);
                            });
                            /* console.log(`sorted rankings: ${matches.map((x) => JSON.stringify(getHighestSeed(x))).join(', ')}`);
                            console.log(`Phase group ${phaseGroupId} placement ${placement} has ${matches.length} matches`);
                            matches.forEach((match) => {
                              let p1name = match.slots[0].entrant ? playerIds[String(match.slots[0].entrant.id)] : 'none';
                              let p2name = match.slots[1].entrant ? playerIds[String(match.slots[1].entrant.id)] : 'none';
                              console.log(
                                `Match ID: ${match.id} round: ${match.round} placement: ${
                                  match.wPlacement
                                } Highest seed: ${JSON.stringify(getHighestSeed(match))} P1: ${p1name} P2: ${p2name}`,
                              );
                            }); */
                        });
                    });
                    let highRound = 0;
                    let highRoundMatch;
                    let finalFinalMatch;
                    let matchIndex = {};
                    Object.entries(matches).forEach(([id, apiMatch]) => {
                        apiMatch.slots.forEach((slot) => {
                            if (slot.prereqType === 'seed') {
                                const seed = seeds[String(slot.prereqId)];
                                if (seed) {
                                    if (!seed.progressionSource)
                                        return;
                                    const phaseGroupId = String(seed.progressionSource.originPhaseGroup.id);
                                    const phaseInfoItem = phaseInfo[phaseGroupId];
                                    if (phaseInfoItem) {
                                        const placement = phaseInfoItem.placements[seed.progressionSource.originPlacement.toString()];
                                        if (placement) {
                                            const index = seed.progressionSource.originOrder - 1;
                                            const match = placement[index];
                                            if (match) {
                                                slot.prereqType = 'set';
                                                slot.prereqId = String(match.id);
                                            }
                                            else
                                                console.log(`No match found for seed ${slot.prereqId}, looking for index ${index} in placement ${seed.progressionSource.originPlacement} in phase group ${phaseGroupId}`);
                                        }
                                        else
                                            console.log(`No phase placement info for seed ${slot.prereqId}, looking for placement ${seed.progressionSource.originPlacement} in phase group ${phaseGroupId}`);
                                    }
                                    else
                                        console.log(`No phase info for seed ${slot.prereqId}, looking for phase group ${phaseGroupId}`);
                                }
                                else
                                    console.log(`No seed match for match ${id}, looking for seed ${slot.prereqId}`);
                            }
                        });
                        let score1 = 0;
                        let score2 = 0;
                        if (apiMatch.slots[0].standing &&
                            apiMatch.slots[0].standing.stats &&
                            apiMatch.slots[0].standing.stats.score &&
                            apiMatch.slots[0].standing.stats.score.value)
                            score1 = apiMatch.slots[0].standing.stats.score.value;
                        if (apiMatch.slots[1].standing &&
                            apiMatch.slots[1].standing.stats &&
                            apiMatch.slots[1].standing.stats.score &&
                            apiMatch.slots[1].standing.stats.score.value)
                            score2 = apiMatch.slots[1].standing.stats.score.value;
                        let match = {
                            id: String(apiMatch.id),
                            player1_id: apiMatch.slots[0].entrant ? String(apiMatch.slots[0].entrant.id) : null,
                            player2_id: apiMatch.slots[1].entrant ? String(apiMatch.slots[1].entrant.id) : null,
                            player1_prereq_match_id: String(apiMatch.slots[0].prereqId),
                            player1_prereq_type: apiMatch.slots[0].prereqType || null,
                            player2_prereq_type: apiMatch.slots[1].prereqType || null,
                            player2_prereq_match_id: String(apiMatch.slots[1].prereqId),
                            winner_id: String(apiMatch.winnerId),
                            round: apiMatch.round,
                            score: {
                                p1: score1,
                                p2: score2,
                            },
                            placement: apiMatch.wPlacement,
                            phaseGroup_id: String(apiMatch.phaseGroup.id),
                        };
                        if (match.player1_id && playerIds[match.player1_id])
                            match.player1_name = playerIds[match.player1_id];
                        if (match.player2_id && playerIds[match.player2_id])
                            match.player2_name = playerIds[match.player2_id];
                        apiMatch.slots.forEach((slot, i) => {
                            const prereqMatch = matches[String(slot.prereqId)];
                            if (prereqMatch) {
                                if (prereqMatch.slots[0].prereqType === 'bye' &&
                                    prereqMatch.slots[1].prereqType !== 'bye' &&
                                    prereqMatch.slots[1].prereqId) {
                                    if (i) {
                                        match.player2_prereq_match_id = String(prereqMatch.slots[1].prereqId);
                                        match.player2_prereq_type = prereqMatch.slots[1].prereqType;
                                    }
                                    else {
                                        match.player1_prereq_match_id = String(prereqMatch.slots[1].prereqId);
                                        match.player1_prereq_type = prereqMatch.slots[1].prereqType;
                                    }
                                }
                                else if (prereqMatch.slots[1].prereqType === 'bye' &&
                                    prereqMatch.slots[0].prereqType !== 'bye' &&
                                    prereqMatch.slots[0].prereqId) {
                                    if (i) {
                                        match.player2_prereq_match_id = String(prereqMatch.slots[0].prereqId);
                                        match.player2_prereq_type = prereqMatch.slots[0].prereqType;
                                    }
                                    else {
                                        match.player1_prereq_match_id = String(prereqMatch.slots[0].prereqId);
                                        match.player1_prereq_type = prereqMatch.slots[0].prereqType;
                                    }
                                }
                            }
                        });
                        matchIndex[match.id] = match;
                        if (match.round == highRound)
                            highRoundMatch = match;
                        if (match.round > highRound) {
                            highRound = match.round;
                            highRoundMatch = match;
                        }
                        if (typeof match.player1_prereq_match_id === 'number' &&
                            typeof match.player2_prereq_match_id === 'number' &&
                            match.player1_prereq_match_id == match.player2_prereq_match_id) {
                            finalFinalMatch = match;
                            highRoundMatch = matchIndex[match.player1_prereq_match_id];
                        }
                    });
                    if (highRoundMatch) {
                        if (finalFinalMatch)
                            highRoundMatch.winner_id = finalFinalMatch.winner_id;
                        res(populateBracket(highRoundMatch, matchIndex));
                    }
                    else {
                        rej('Bad data from smash.gg');
                    }
                });
            }
            else {
                rej('Bad phase data from smash.gg');
            }
        })
            .catch((err) => {
            rej(err);
        });
    });
}
function getSmashggPhaseSeeds(phaseId, existingArray, startpage) {
    return new Promise((res, rej) => {
        const page = startpage || 1;
        console.log(`Getting phase seeds for phase ${phaseId} page ${page}. Existing array length: ${existingArray ? existingArray.length : 0}`);
        let smashPhaseSeedQuery = '{phase(id: ' +
            phaseId +
            '){seeds(query:{page:' +
            page +
            ',perPage:20}){pageInfo{totalPages} nodes{id seedNum progressionSource{originOrder originPlacement originPhaseGroup{id}}}}}}';
        smashggFetch(smashPhaseSeedQuery)
            .then((resp) => {
            if (typeof resp === 'object' &&
                resp !== null &&
                'phase' in resp &&
                typeof resp.phase === 'object' &&
                resp.phase !== null &&
                'seeds' in resp.phase &&
                typeof resp.phase.seeds === 'object' &&
                resp.phase.seeds !== null &&
                'pageInfo' in resp.phase.seeds &&
                typeof resp.phase.seeds.pageInfo === 'object' &&
                resp.phase.seeds.pageInfo !== null &&
                'totalPages' in resp.phase.seeds.pageInfo &&
                typeof resp.phase.seeds.pageInfo.totalPages === 'number' &&
                'nodes' in resp.phase.seeds &&
                Array.isArray(resp.phase.seeds.nodes)) {
                //console.log(`Phase seed data received for phase ${phaseId} page ${page}`);
                if (existingArray) {
                    //console.log(`Existing array length: ${existingArray.length}`);
                    //console.log(`incoming array length: ${resp.phase.seeds.nodes.length}`);
                    resp.phase.seeds.nodes.push(...existingArray);
                }
                if (resp.phase.seeds.pageInfo.totalPages > page) {
                    getSmashggPhaseSeeds(phaseId, resp.phase.seeds.nodes, page + 1)
                        .then((resp) => {
                        res(resp);
                    })
                        .catch((err) => {
                        rej(err);
                    });
                }
                else {
                    console.log(`Phase seed data complete for phase ${phaseId}: ${resp.phase.seeds.nodes.length} seeds`);
                    res(resp.phase.seeds.nodes);
                }
            }
            else {
                rej('Bad phase seed data from smash.gg');
            }
        })
            .catch((err) => {
            rej(err);
        });
    });
}
function getSmashggPhaseMatches(phaseId, existingArray, startpage) {
    return new Promise((res, rej) => {
        const page = startpage || 1;
        /* console.log(
          `Getting phase matches for phase ${phaseId} page ${page}. Existing array length: ${
            existingArray ? existingArray.length : 0
          }`,
        ); */
        let smashPhaseMatchQuery = '{phase(id: ' +
            phaseId +
            '){sets(page:' +
            page +
            'perPage:20filters:{showByes:true}){pageInfo{totalPages} nodes{id phaseGroup{id} wPlacement round winnerId slots{prereqId prereqType seed{seedNum} entrant{id} standing{stats{score{value}}}}}}}}';
        smashggFetch(smashPhaseMatchQuery).then((resp) => {
            if (resp &&
                resp.phase &&
                resp.phase.sets &&
                resp.phase.sets.nodes &&
                Array.isArray(resp.phase.sets.nodes) &&
                resp.phase.sets.pageInfo &&
                typeof resp.phase.sets.pageInfo.totalPages === 'number') {
                //console.log(`Phase match data received for phase ${phaseId} page ${page}`);
                if (existingArray) {
                    /* console.log(`Existing array length: ${existingArray.length}`);
                    console.log(`incoming array length: ${resp.phase.sets.nodes.length}`); */
                    resp.phase.sets.nodes = [...existingArray, ...resp.phase.sets.nodes];
                }
                if (resp.phase.sets.pageInfo.totalPages > page) {
                    getSmashggPhaseMatches(phaseId, resp.phase.sets.nodes, page + 1)
                        .then((resp) => {
                        res(resp);
                    })
                        .catch((err) => {
                        rej(err);
                    });
                }
                else {
                    console.log(`Phase match data complete for phase ${phaseId}: ${resp.phase.sets.nodes.length} matches`);
                    res(resp.phase.sets.nodes);
                }
            }
            else {
                rej('Bad phase match data from smash.gg');
            }
        });
    });
}
function populateBracket(match, matchIndex) {
    let p1name;
    let p2name;
    if (match.player1_name) {
        p1name = match.player1_name;
    }
    else
        p1name = '';
    if (match.player2_name) {
        p2name = match.player2_name;
    }
    else
        p2name = '';
    let rtn = { p1name: p1name, p2name: p2name };
    if (match.score)
        rtn.score = match.score;
    if (match.winner_id && match.winner_id == match.player1_id)
        rtn.winner = 'p1';
    if (match.winner_id && match.winner_id == match.player2_id)
        rtn.winner = 'p2';
    if (match.round < 0)
        rtn.losers = true;
    if (match.player1_prereq_match_id &&
        matchIndex[match.player1_prereq_match_id] &&
        (match.round >= 0 || (match.round < 0 && matchIndex[match.player1_prereq_match_id].round < 0))) {
        rtn.p1match = populateBracket(matchIndex[match.player1_prereq_match_id], matchIndex);
    } // else console.log(`No p1 prereq match for match. Id: ${match.player1_prereq_match_id}`);
    if (match.player2_prereq_match_id &&
        matchIndex[match.player2_prereq_match_id] &&
        (match.round >= 0 || (match.round < 0 && matchIndex[match.player2_prereq_match_id].round < 0))) {
        rtn.p2match = populateBracket(matchIndex[match.player2_prereq_match_id], matchIndex);
    } // else console.log(`No p2 prereq match for match. Id: ${match.player2_prereq_match_id}`);
    /* console.log(
      `p1: ${rtn.p1name} p2: ${rtn.p2name} round: ${match.round}, p1match: ${match.player1_prereq_match_id}, p2match: ${match.player2_prereq_match_id}`,
    ); */
    return rtn;
}
function myError(err) {
    nodecg.log.error(new Error(err).stack);
    nodecg.log.error(JSON.stringify(err));
}
function isSmashggApiSeed(x) {
    if (!!x &&
        typeof x === 'object' &&
        x !== null &&
        'id' in x &&
        (typeof x.id === 'number' || typeof x.id === 'string') &&
        'seedNum' in x &&
        typeof x.seedNum === 'number' &&
        'progressionSource' in x &&
        (x.progressionSource === null ||
            (typeof x.progressionSource === 'object' &&
                'originOrder' in x.progressionSource &&
                typeof x.progressionSource.originOrder === 'number' &&
                'originPlacement' in x.progressionSource &&
                typeof x.progressionSource.originPlacement === 'number' &&
                'originPhaseGroup' in x.progressionSource &&
                typeof x.progressionSource.originPhaseGroup === 'object' &&
                x.progressionSource.originPhaseGroup !== null &&
                'id' in x.progressionSource.originPhaseGroup &&
                (typeof x.progressionSource.originPhaseGroup.id === 'number' ||
                    typeof x.progressionSource.originPhaseGroup.id === 'string')))) {
        return true;
    }
    else {
        return false;
    }
}
function isSmashggApiMatch(match) {
    if (!!match &&
        typeof match === 'object' &&
        (typeof match.id == 'number' || typeof match.id == 'string') &&
        typeof match.round == 'number' &&
        (typeof match.winnerId == 'number' || match.winnerId == null) &&
        match.slots) {
        let rtn = true;
        let slots = match.slots;
        if (Array.isArray(slots)) {
            slots.forEach((slot) => {
                if (typeof slot === 'object' &&
                    slot !== null &&
                    'prereqId' in slot &&
                    (typeof slot.prereqId === 'string' || typeof slot.prereqId === 'number' || slot.prereqId === null) &&
                    'prereqType' in slot &&
                    (slot.prereqType === 'set' ||
                        slot.prereqType === 'seed' ||
                        slot.prereqType === 'bye' ||
                        slot.prereqType === null) &&
                    'entrant' in slot &&
                    (slot.entrant === null ||
                        (typeof slot.entrant === 'object' && 'id' in slot.entrant && typeof slot.entrant.id == 'number'))) {
                    if ('standing' in slot &&
                        typeof slot.standing === 'object' &&
                        (slot.standing === null ||
                            ('stats' in slot.standing &&
                                typeof slot.standing.stats === 'object' &&
                                slot.standing.stats !== null &&
                                'score' in slot.standing.stats &&
                                typeof slot.standing.stats.score === 'object' &&
                                slot.standing.stats.score !== null &&
                                'value' in slot.standing.stats.score &&
                                (typeof slot.standing.stats.score.value === 'number' || slot.standing.stats.score.value === null)))) {
                        //
                    }
                    else {
                        rtn = false;
                        console.log('slot standing error');
                    }
                    if ('seed' in slot &&
                        (slot.seed === null ||
                            (typeof slot.seed === 'object' && 'seedNum' in slot.seed && typeof slot.seed.seedNum === 'number'))) {
                        //
                    }
                    else {
                        rtn = false;
                        console.log('slot seed error');
                    }
                    if (!('prereqType' in slot) || typeof slot.prereqType !== 'string') {
                        rtn = false;
                        console.log('slot prereqType error');
                    }
                }
                else {
                    rtn = false;
                    console.log('slot error');
                }
            });
        }
        if (!('phaseGroup' in match) ||
            typeof match.phaseGroup !== 'object' ||
            match.phaseGroup === null ||
            !('id' in match.phaseGroup) ||
            typeof match.phaseGroup.id !== 'number') {
            rtn = false;
            console.log('set.phaseGroup error');
        }
        if (!('wPlacement' in match) || (typeof match.wPlacement !== 'number' && match.wPlacement !== null)) {
            rtn = false;
            console.log('wPlacement error');
        }
        return rtn;
    }
    else {
        console.log('basic error');
        console.log(match);
        return false;
    }
}
