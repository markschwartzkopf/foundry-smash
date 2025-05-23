import { bracketMatch, losersRep } from "../shared-types/shared";
import { browserBracketMatch } from "./types/browser";

export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

const bracketRep = nodecg.Replicant<bracketMatch>('bracket');
const losersRep = nodecg.Replicant<losersRep>('losers');
const roundsRep = nodecg.Replicant<number | null>('rounds');

let winnersResize: (() => void)[] = [];
let losersResize: (() => void)[] = [];

const ro = new ResizeObserver((entries) => {
	for (let entry of entries) {
		if (entry.target.classList.contains('losers')) {
			for (let x = 0; x < losersResize.length; x++) {
				losersResize[x]();
			}
		} else {
			for (let x = 0; x < winnersResize.length; x++) {
				winnersResize[x]();
			}
		}
	}
});

bracketRep.on('change', (newVal) => {
  if (!newVal) return;
	NodeCG.waitForReplicants(losersRep, roundsRep).then(() => {
		drawBracket(newVal, losersRep.value!, roundsRep.value!);
	});
});

losersRep.on('change', (newVal) => {
  if (!newVal) return;
	NodeCG.waitForReplicants(losersRep, roundsRep).then(() => {
		drawBracket(bracketRep.value!, newVal, roundsRep.value!);
	});
});

roundsRep.on('change', (newVal) => {
  if (!newVal) return;
	NodeCG.waitForReplicants(losersRep, roundsRep).then(() => {
		drawBracket(bracketRep.value!, losersRep.value!, newVal);
	});
});

function drawBracket(
	bracketRep: bracketMatch,
	loserRep: losersRep,
	roundsRep: number | null
) {
	let bracket = addParents(bracketRep);
	let columns: browserBracketMatch[][] = [[]];
	let counts = addToColumns(bracket, columns, 0);
	let rounds = columns.length - 1;
	if (roundsRep && roundsRep < columns.length) rounds = roundsRep;
	let winnersLargestColumn = 0;
	let losersLargestColumn = 0;
	for (let x = 0; x <= rounds; x++) {
		if (counts[x].winners >= counts[winnersLargestColumn].winners) {
			winnersLargestColumn = x;
		}
		if (counts[x].losers >= counts[losersLargestColumn].losers) {
			losersLargestColumn = x;
		}
	}
	let winnersSize = counts[winnersLargestColumn].winners;
	let losersSize = counts[losersLargestColumn].losers;
	document.body.innerHTML = '';
	winnersResize = [];
	losersResize = [];
	let bracketDiv = document.createElement('div');
	bracketDiv.id = 'bracket';
	let losersBracketDiv = document.createElement('div');
	losersBracketDiv.id = 'losers-bracket';
	let winnersColumns: HTMLSpanElement[] = [];
	let losersColumns: HTMLSpanElement[] = [];
	let championColumn = document.createElement('span');
	championColumn.className = 'column';
	bracketDiv.appendChild(championColumn);
	let blankColumn = document.createElement('span');
	blankColumn.className = 'column';
	losersBracketDiv.appendChild(blankColumn);
	for (let x = 0; x <= rounds; x++) {
		winnersColumns.push(document.createElement('span'));
		losersColumns.push(document.createElement('span'));
		winnersColumns[x].className = 'column';
		if (x == winnersLargestColumn)
			winnersColumns[x].classList.add('big-column');
		losersColumns[x].className = 'column';
		if (x == losersLargestColumn)
			losersColumns[x].classList.add('big-column', 'losers');
		bracketDiv.appendChild(winnersColumns[x]);
		losersBracketDiv.appendChild(losersColumns[x]);
	}
	bracketDiv.style.height =
		(winnersSize / (winnersSize + losersSize)) * 100 - 0.5 + '%';
	losersBracketDiv.style.height =
		(losersSize / (winnersSize + losersSize)) * 100 - 0.5 + '%';
	ro.observe(winnersColumns[winnersLargestColumn]);
	ro.observe(losersColumns[losersLargestColumn]);
	if (loserRep != 'only') document.body.appendChild(bracketDiv);
	if (loserRep != 'off') document.body.appendChild(losersBracketDiv);
	for (let x = rounds; x >= 0; x--) {
		for (let y = 0; y < columns[x].length; y++) {
			let match = columns[x][y];
			let matchDiv = document.createElement('div');
			matchDiv.className = 'match';
			let p1Div = document.createElement('div');
			let p2Div = document.createElement('div');
			let p1Text = document.createElement('div');
			let p2Text = document.createElement('div');
			if (y > 0) {
				let prevMatch = columns[x][y - 1];
				if (!prevMatch.losers && match.losers) {
					match.prevHtmlRect = bracketDiv;
				} else match.prevHtmlRect = prevMatch.htmlRect;
			}
			p1Div.className = 'player';
			p2Div.className = 'player';
			p2Div.classList.add('player2');
			p1Text.className = 'player-text';
			p2Text.className = 'player-text';
			p1Text.innerHTML = columns[x][y].p1name;
			p2Text.innerHTML = columns[x][y].p2name;
			p1Div.appendChild(p1Text);
			p2Div.appendChild(p2Text);
			matchDiv.appendChild(p1Div);
			matchDiv.appendChild(p2Div);

			let largestColumn = winnersLargestColumn;
			if (match.losers) largestColumn = losersLargestColumn;
			if (x < largestColumn) {
				let setHeights = () => {
					let yStart = 0;
					let p1Height = 0;
					if (match.prevHtmlRect)
						yStart = match.prevHtmlRect.getBoundingClientRect().bottom;
					if (!yStart) yStart = 0;
					if (match.p1match && match.p1match.htmlRect) {
						let [parentY, parentHeight] = [
							match.p1match!.htmlRect.getBoundingClientRect().y,
							match.p1match!.htmlRect.getBoundingClientRect().height,
						];
						if (parentY && parentHeight) {
							p1Height = parentY + parentHeight / 2 - yStart;
							p1Div.style.height = p1Height + 'px';
						}
					} else {
						let prevMatch = columns[x][y - 1];
						if (
							prevMatch &&
							prevMatch.p2match &&
							prevMatch.p2match.htmlRect &&
							match.p2match &&
							match.p2match.htmlRect
						) {
							let [firstY, secondY] = [
								prevMatch.p2match.htmlRect.getBoundingClientRect().bottom,
								match.p2match.htmlRect.getBoundingClientRect().y,
							];

							let targetY = (firstY + secondY) / 2;
							p1Height = targetY - yStart;
							p1Div.style.height = p1Height + 'px';
						}
					}
					if (p1Div.getBoundingClientRect().bottom > 0) {
						yStart = p1Div.getBoundingClientRect().bottom;
					} else yStart = yStart + p1Height;

					if (match.p2match && match.p2match.htmlRect) {
						let [parentY, parentHeight] = [
							match.p2match!.htmlRect.getBoundingClientRect().y,
							match.p2match!.htmlRect.getBoundingClientRect().height,
						];
						if (parentY && parentHeight) {
							let height = parentY + parentHeight / 2 - yStart;
							yStart = yStart + height;
							p2Div.style.height = height + 'px';
						}
					} else if (x == 0) {
						if (match.p1match && match.p1match.htmlRect) {
							let [firstY, secondY] = [
								match.p1match!.htmlRect.getBoundingClientRect().bottom,
								bracketDiv.getBoundingClientRect().bottom,
							];
							if (firstY && secondY) {
								let p2Height = (firstY + secondY) / 2 - yStart;
								p2Div.style.height = p2Height + 'px';
							}
						}
					}
				};
				setHeights();
				if (match.losers || x == 0) {
					losersResize.push(setHeights);
				} else winnersResize.push(setHeights);
			} else {
				if (x > largestColumn) {
					let setHeights = () => {
						let yStart = 0;
						let p1Height = 0;
						if (match.prevHtmlRect)
							yStart = match.prevHtmlRect.getBoundingClientRect().bottom;
						if (!yStart) yStart = 0;
						if (match.parent && match.parent.htmlRect) {
							let [parentY, parentHeight] = [
								match.parent!.htmlRect.getBoundingClientRect().y,
								match.parent!.htmlRect.getBoundingClientRect().height,
							];
							if (match.parentPlayer == 1) {
								p1Height = parentY - parentHeight / 2 - yStart;
							} else p1Height = parentY + parentHeight / 2 - yStart;
							p1Div.style.height = p1Height + 'px';
							p2Div.style.height = parentHeight + 'px';
						}
					};
					setHeights();
					if (match.losers || x == 0) {
						losersResize.push(setHeights);
					} else winnersResize.push(setHeights);
				}
			}
			if (match.losers && loserRep != 'off') {
				p1Div.classList.add('losers');
				p2Div.classList.add('losers');
				losersColumns[x].appendChild(matchDiv);
				match.htmlRect = p2Div;
			}
			if (!match.losers && loserRep != 'only') {
				winnersColumns[x].appendChild(matchDiv);
				match.htmlRect = p2Div;
			}
		}
	}
	let matchDiv = document.createElement('div');
	matchDiv.className = 'match';
	let championDiv = document.createElement('div');
	championDiv.classList.add('player', 'champ');
	let championText = document.createElement('div');
	championText.className = 'player-text';
	if (columns[0][0].winner) {
		if (columns[0][0].winner == 'p1') {
			championText.innerHTML = columns[0][0].p1name;
		} else {
			championText.innerHTML = columns[0][0].p2name;
		}
	}
	championDiv.appendChild(championText);
	matchDiv.appendChild(championDiv);
	let finalMatch = columns[0][0];
	let setHeights = () => {
		let yStart = 0;
		let champHeight = 0;
		if (finalMatch && finalMatch.htmlRect) {
			let [firstY, secondY] = [
				finalMatch.htmlRect.getBoundingClientRect().y,
				finalMatch.htmlRect.getBoundingClientRect().bottom,
			];
			if (firstY && secondY) {
				champHeight = (firstY + secondY) / 2 - yStart;
				championDiv.style.height = champHeight + 'px';
			}
		}
	};
	setHeights();
	losersResize.push(setHeights);
	winnersResize.push(setHeights);
	championColumn.appendChild(matchDiv);
}

function addToColumns(
	bracket: browserBracketMatch,
	columns: browserBracketMatch[][],
	index: number,
	counts?: { winners: number; losers: number }[]
): { winners: number; losers: number }[] {
	if (!counts) counts = [{ winners: 0, losers: 0 }];
	while (index >= columns.length) columns.push([]);
	while (index >= counts.length) counts.push({ winners: 0, losers: 0 });
	columns[index].push(bracket);
	if (bracket.losers) {
		counts[index].losers++;
	} else counts[index].winners++;

	/* let ghostMatch: browserBracketMatch = {
		p1name: 'ghost',
		p2name: 'ghost',
		parent: bracket,
		ghost: true,
	};
  if (!bracket.p1match?.losers && bracket.losers) {
    ghostMatch.losers = true;
    if (columns.length < index + 2) columns.push([]);
    columns[index + 1].push(ghostMatch);
    console.log('ghost1');
  } */
	if (bracket.p1match)
		addToColumns(bracket.p1match, columns, index + 1, counts);
	if (bracket.p2match)
		addToColumns(bracket.p2match, columns, index + 1, counts);
	/* if (bracket.p2match?.losers && !bracket.losers) {
		if (columns.length < index + 2) columns.push([]);
		columns[index + 1].push(ghostMatch);
		console.log('ghost1');
	} */
	return counts;
}

function addParents(inMatch: bracketMatch): browserBracketMatch {
	let match = JSON.parse(JSON.stringify(inMatch)) as browserBracketMatch;
	if (inMatch.p1match) {
		match.p1match = addParents(inMatch.p1match);
		match.p1match.parent = match;
		match.p1match.parentPlayer = 1;
	}
	if (inMatch.p2match) {
		match.p2match = addParents(inMatch.p2match);
		match.p2match.parent = match;
		match.p2match.parentPlayer = 2;
	}

	return match;
}
