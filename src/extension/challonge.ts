import { NodeCG } from '../../../../types/server';
import fetch from 'node-fetch';
const nodecg: NodeCG = require('./nodecg-api-context').get();

const tournamentRep = nodecg.Replicant<string>('tournamentUrl');
const challongeBracketRep = nodecg.Replicant<bracketMatch>('challongeBracket');
const challongePlayersRep =
	nodecg.Replicant<challongePlayers>('challongePlayers');
let apiKey = require('../../../challonge-key.json').key;
const apiUrl = 'https://api.challonge.com/v1/';

tournamentRep.value = 'wt15';
function methodUrl(method: 'matches' | 'participants') {
	return (
		apiUrl +
		'tournaments/' +
		tournamentRep.value +
		'/' +
		method +
		'.json?api_key=' +
		apiKey
	);
}
pullFromChallonge();
nodecg.listenFor('updateChallongeBracket', () => {
  pullFromChallonge();
})

function pullFromChallonge() {
	getChallongeParticipants()
		.then((resp) => {
			challongePlayersRep.value = resp;
			return getChallongeMatches();
		})
		.then((resp) => {
			challongeBracketRep.value = resp;
		})
		.catch((err) => {
			myError(err);
		});
}

function getChallongeParticipants() {
	return new Promise<challongePlayers>((res, rej) => {
		let rtn: challongePlayers = {};
		fetch(methodUrl('participants'), { method: 'GET' })
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
		fetch(methodUrl('matches'), { method: 'GET' })
			.then((resp) => {
				return resp.json();
			})
			.then((resp) => {
				let rtn: bracketMatch;
				if (Array.isArray(resp)) {
					let matchArray = resp as any[];
					let highRound = 0;
					let highRoundMatch: challongeMatch | undefined;
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
							if (
								match.player1_id &&
								challongePlayersRep.value[match.player1_id.toString()]
							)
								match.player1_name =
									challongePlayersRep.value[match.player1_id.toString()];
							if (
								match.player2_id &&
								challongePlayersRep.value[match.player2_id.toString()]
							)
								match.player2_name =
									challongePlayersRep.value[match.player2_id.toString()];
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
					});
          if (highRoundMatch) {
            if (
              highRoundMatch.player1_prereq_match_id &&
              highRoundMatch.player2_prereq_match_id &&
              highRoundMatch.player1_prereq_match_id ==
              highRoundMatch.player2_prereq_match_id
            ) {
              highRoundMatch = matchIndex[highRoundMatch.player1_prereq_match_id];
            }
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

function populateBracket(
	match: challongeMatch,
	matchIndex: { [id: string]: challongeMatch }
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
	if (
		match.player1_prereq_match_id &&
		matchIndex[match.player1_prereq_match_id] &&
		match.player1_is_prereq_match_loser == false
	) {
		rtn.p1match = populateBracket(
			matchIndex[match.player1_prereq_match_id],
			matchIndex
		);
	}
	if (
		match.player2_prereq_match_id &&
		matchIndex[match.player2_prereq_match_id] &&
		match.player2_is_prereq_match_loser == false
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
}
