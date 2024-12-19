import NodeCG from '@nodecg/types';
import fetch from 'node-fetch';
import { bracketMatch, bracketSource, playerIds } from '../shared-types/shared';
import { challongeMatch, smashggApiMatch, smashggMatch } from './types/server';
const nodecg: NodeCG.ServerAPI = require('./nodecg-api-context').get();

const tournamentRep = nodecg.Replicant<string>('tournamentUrl'); //ie 'tournament/whos-tyler-11-100-pot-bonus/event/ultimate-singles' for smash.gg or 'wt15' for challonge
const bracketRep = nodecg.Replicant<bracketMatch>('bracket');
const bracketSourceRep = nodecg.Replicant<bracketSource>('bracketSource');
let playerIds: playerIds = {};
function hasChallongeKey(bundleConfig: NodeCG.ServerAPI['bundleConfig']): bundleConfig is { keys: { challongeKey: string } } {
  const bc = bundleConfig as any;
  return bc.keys && bc.keys.challongeKey && typeof bc.keys.challongeKey === 'string';
}
function hasSmashggKey(bundleConfig: NodeCG.ServerAPI['bundleConfig']): bundleConfig is { keys: { smashggKey: string } } {
  const bc = bundleConfig as any;
  return bc.keys && bc.keys.smashggKey && typeof bc.keys.smashggKey === 'string';
}
const challongeApiKey = hasChallongeKey(nodecg.bundleConfig) ? nodecg.bundleConfig.keys.challongeKey : '';
const smashggApiKey = hasSmashggKey(nodecg.bundleConfig) ? nodecg.bundleConfig.keys.smashggKey : '';
const challongeApiUrl = 'https://api.challonge.com/v1/';
const smashggApiUrl = 'https://api.start.gg/gql/alpha';

function ChallongeMethodUrl(method: 'matches' | 'participants') {
	return (
		challongeApiUrl +
		'tournaments/' +
		tournamentRep.value +
		'/' +
		method +
		'.json?api_key=' +
		challongeApiKey
	);
}

if (bracketSourceRep.value == 'challonge') {
	pullFromChallonge();
} else pullFromSmashgg();

nodecg.listenFor('updateBracket', () => {
	if (bracketSourceRep.value == 'challonge') {
		pullFromChallonge();
	} else pullFromSmashgg();
});
//let slug = 'tournament/whos-tyler-11-100-pot-bonus/event/ultimate-singles';

function smashggFetch(query: string, slug: string) {
	let queryString = JSON.stringify({
		query: '{event(slug: "' + slug + '")' + query + '}',
	});
	return new Promise<any>((res, rej) => {
		fetch(smashggApiUrl, {
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
				} else if (resp.errorId !== undefined) {
					rej({ message: resp.message, errorId: resp.errorId });
				} else res(resp.data);
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
			return getSmashggMatches();
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
	return new Promise<playerIds>((res, rej) => {
		let rtn: playerIds = {};
		let smashParticipantQuery =
			'{entrants(query: {perPage: 500}){nodes{id name participants{gamerTag}}}}';
		smashggFetch(smashParticipantQuery, tournamentRep.value!)
			.then((resp) => {
				if (
					resp &&
					resp.event &&
					resp.event.entrants &&
					resp.event.entrants.nodes &&
					Array.isArray(resp.event.entrants.nodes)
				) {
					let playerArray = resp.event.entrants.nodes as any[];
					playerArray.forEach((x) => {
						let id = x.id;
						let name = x.name;
						if (
							x.participants &&
							x.participants[0] &&
							x.participants[0].gamerTag
						) {
							name = x.participants[0].gamerTag;
							if (x.participants[1] && x.participants[1].gamerTag) {
								name = name + ' & ' + x.participants[1].gamerTag;
							}
						}
						if (typeof id == 'number' && typeof name == 'string') {
							rtn[id.toString()] = name;
						} else rej('Bad data from Challonge');
					});
					res(rtn);
				} else {
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
	return new Promise<playerIds>((res, rej) => {
		let rtn: playerIds = {};
		fetch(ChallongeMethodUrl('participants'), { method: 'GET' })
			.then((resp) => {
				return resp.json();
			})
			.then((resp) => {
				if (Array.isArray(resp)) {
					let playerArray = resp as any[];
					playerArray.forEach((x) => {
						let id = x.participant?.id;
						let name = x.participant?.display_name;
						if (typeof id == 'number' && typeof name == 'string') {
							rtn[id.toString()] = name;
						} else rej('Bad data from Challonge');
					});
					res(rtn);
				} else {
					rej('Bad data from Challonge: Not an array');
				}
			})
			.catch((err) => {
				rej(err);
			});
	});
}

function getChallongeMatches() {
	return new Promise<bracketMatch>((res, rej) => {
		fetch(ChallongeMethodUrl('matches'), { method: 'GET' })
			.then((resp) => {
				return resp.json();
			})
			.then((resp) => {
				let rtn: bracketMatch;
				if (Array.isArray(resp)) {
					let matchArray = resp as any[];
					let highRound = 0;
					let highRoundMatch: challongeMatch | undefined;
					let finalFinalMatch: challongeMatch | undefined;
					let matchIndex: { [id: string]: challongeMatch } = {};
					matchArray.forEach((x) => {
						let match: challongeMatch = {
							id: x.match?.id,
							player1_id: x.match?.player1_id,
							player2_id: x.match?.player2_id,
							player1_prereq_match_id: x.match?.player1_prereq_match_id,
							player2_prereq_match_id: x.match?.player2_prereq_match_id,
							player1_is_prereq_match_loser:
								x.match?.player1_is_prereq_match_loser,
							player2_is_prereq_match_loser:
								x.match?.player2_is_prereq_match_loser,
							winner_id: x.match?.winner_id,
							loser_id: x.match?.loser_id,
							round: x.match?.round,
						};
						if (
							typeof match.id == 'number' &&
							(typeof match.player1_id == 'number' ||
								match.player1_id == null) &&
							(typeof match.player2_id == 'number' ||
								match.player2_id == null) &&
							(typeof match.player1_prereq_match_id == 'number' ||
								match.player1_prereq_match_id == null) &&
							(typeof match.player2_prereq_match_id == 'number' ||
								match.player2_prereq_match_id == null) &&
							typeof match.player1_is_prereq_match_loser == 'boolean' &&
							typeof match.player2_is_prereq_match_loser == 'boolean' &&
							(typeof match.winner_id == 'number' || match.winner_id == null) &&
							(typeof match.loser_id == 'number' || match.loser_id == null) &&
							typeof match.round == 'number'
						) {
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
							} else rej('Bad data from Challonge');
							matchIndex[match.id.toString()] = match;
							if (match.round == highRound) highRoundMatch = match;
							if (match.round > highRound) {
								highRound = match.round;
								highRoundMatch = match;
							}
						} else rej('Bad data from Challonge');
						if (
							match.player1_prereq_match_id &&
							match.player2_prereq_match_id &&
							match.player1_prereq_match_id == match.player2_prereq_match_id
						) {
							finalFinalMatch = match;
							highRoundMatch = matchIndex[match.player1_prereq_match_id];
						}
					});
					if (highRoundMatch) {
						if (finalFinalMatch && finalFinalMatch.winner_id)
							highRoundMatch.winner_id = finalFinalMatch?.winner_id;
						rtn = populateBracket(highRoundMatch, matchIndex);
						res(rtn);
					} else {
						rej('Bad data from Challonge');
					}
				} else {
					rej('Bad data from Challonge: Not an array');
				}
			})
			.catch((err) => {
				rej(err);
			});
	});
}

function getSmashggMatches(existingArray?: any[], nextPage?: number) {
	return new Promise<bracketMatch>((res, rej) => {
		function smashMatchQuery(page: number) {
			return (
				'{sets(page:' +
				page +
				'perPage:20){pageInfo{totalPages} nodes{id round winnerId slots{prereqId entrant{id} standing{stats{score{value}}}}}}}'
			);
		}
		//let smashMatchQuery =
		if (!nextPage) nextPage = 1;
		smashggFetch(smashMatchQuery(nextPage), tournamentRep.value!)
			.then((resp) => {
				let rtn: bracketMatch;
				if (
					resp &&
					resp.event &&
					resp.event.sets &&
					resp.event.sets.nodes &&
					Array.isArray(resp.event.sets.nodes) &&
					resp.event.sets.pageInfo &&
					resp.event.sets.pageInfo.totalPages
				) {
					if (existingArray)
						resp.event.sets.nodes = [
							...existingArray,
							...resp.event.sets.nodes,
						];
					if (!nextPage) nextPage = 1;
					if (resp.event.sets.pageInfo.totalPages > nextPage) {
						getSmashggMatches(resp.event.sets.nodes, nextPage + 1)
							.then((resp) => {
								res(resp);
							})
							.catch((err) => {
								rej(err);
							});
					} else {
						let matchArray = resp.event.sets.nodes as any[];
						let highRound = 0;
						let highRoundMatch: smashggMatch | undefined;
						let finalFinalMatch: smashggMatch | undefined;
						let matchIndex: { [id: string]: smashggMatch } = {};
						matchArray.forEach((x) => {
							if (isSmashggApiMatch(x)) {
								let score1 = 0;
								let score2 = 0;
								if (
									x.slots[0].standing &&
									x.slots[0].standing.stats &&
									x.slots[0].standing.stats.score &&
									x.slots[0].standing.stats.score.value
								)
									score1 = x.slots[0].standing.stats.score.value;
								if (
									x.slots[1].standing &&
									x.slots[1].standing.stats &&
									x.slots[1].standing.stats.score &&
									x.slots[1].standing.stats.score.value
								)
									score2 = x.slots[1].standing.stats.score.value;
								let match: smashggMatch = {
									id: x.id,
									player1_id: x.slots[0].entrant ? x.slots[0].entrant.id : null,
									player2_id: x.slots[1].entrant ? x.slots[1].entrant.id : null,
									player1_prereq_match_id: x.slots[0].prereqId,
									player2_prereq_match_id: x.slots[1].prereqId,
									winner_id: x.winnerId,
									round: x.round,
									score: {
										p1: score1,
										p2: score2,
									},
								};
								if (match.player1_id && playerIds[match.player1_id.toString()])
									match.player1_name = playerIds[match.player1_id.toString()];
								if (match.player2_id && playerIds[match.player2_id.toString()])
									match.player2_name = playerIds[match.player2_id.toString()];
								matchIndex[match.id.toString()] = match;
								if (match.round == highRound) highRoundMatch = match;
								if (match.round > highRound) {
									highRound = match.round;
									highRoundMatch = match;
								}
								if (
									match.player1_prereq_match_id &&
									match.player2_prereq_match_id &&
									match.player1_prereq_match_id == match.player2_prereq_match_id
								) {
									finalFinalMatch = match;
									highRoundMatch = matchIndex[match.player1_prereq_match_id];
								}
							} else rej('Bad data from smash.gg');
						});
						if (highRoundMatch) {
							if (finalFinalMatch)
								highRoundMatch.winner_id = finalFinalMatch.winner_id;
							rtn = populateBracket(highRoundMatch, matchIndex);
							res(rtn);
						} else {
							rej('Bad data from smash.gg');
						}
					}
				}
			})
			.catch((err) => {
				rej(err);
			});
	});
}

function populateBracket(
	match: challongeMatch | smashggMatch,
	matchIndex: { [id: string]: challongeMatch } | { [id: string]: smashggMatch }
): bracketMatch {
	let p1name: string;
	let p2name: string;
	if (match.player1_name) {
		p1name = match.player1_name;
	} else p1name = '';
	if (match.player2_name) {
		p2name = match.player2_name;
	} else p2name = '';
	let rtn: bracketMatch = { p1name: p1name, p2name: p2name };
	if (match.score) rtn.score = match.score;
	if (match.winner_id && match.winner_id == match.player1_id) rtn.winner = 'p1';
	if (match.winner_id && match.winner_id == match.player2_id) rtn.winner = 'p2';
	if (match.round < 0) rtn.losers = true;
	if (
		match.player1_prereq_match_id &&
		matchIndex[match.player1_prereq_match_id] &&
		(match.round >= 0 ||
			(match.round < 0 && matchIndex[match.player1_prereq_match_id].round < 0))
	) {
		rtn.p1match = populateBracket(
			matchIndex[match.player1_prereq_match_id],
			matchIndex
		);
	}
	if (
		match.player2_prereq_match_id &&
		matchIndex[match.player2_prereq_match_id] &&
		(match.round >= 0 ||
			(match.round < 0 && matchIndex[match.player2_prereq_match_id].round < 0))
	) {
		rtn.p2match = populateBracket(
			matchIndex[match.player2_prereq_match_id],
			matchIndex
		);
	}
	return rtn;
}

function myError(err: any) {
	nodecg.log.error(new Error(err).stack);
	nodecg.log.error(JSON.stringify(err));
}

function isSmashggApiMatch(x: unknown): x is smashggApiMatch {
	if (
		!!x &&
		(typeof (x as smashggApiMatch).id == 'number' ||
			typeof (x as smashggApiMatch).id == 'string') &&
		typeof (x as smashggApiMatch).round == 'number' &&
		(typeof (x as smashggApiMatch).winnerId == 'number' ||
			(x as smashggApiMatch).winnerId == null) &&
		(x as smashggApiMatch).slots
	) {
		let rtn = true;
		let slots = (x as smashggApiMatch).slots as unknown;
		if (Array.isArray(slots)) {
			slots.forEach((y: any) => {
				if (y.prereqId && (!y.entrant || typeof y.entrant.id == 'number')) {
					if (
						y.standing &&
						y.standing.stats &&
						y.standing.stats.score &&
						y.standing.stats.score.value &&
						typeof y.standing.stats.score.value != 'number'
					) {
						rtn = false;
						console.log('standing error');
					}
				} else {
					rtn = false;
					console.log('slot error');
				}
			});
		}

		return rtn;
	} else {
		console.log('basic error');
		console.log(x);
		return false;
	}
}
