/// <reference path="../../../../types/browser.d.ts" />
export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

/* const playTypeRep = nodecg.Replicant<playType>('playType');
let playTypeDiv = document.getElementById('category') as HTMLDivElement;
playTypeRep.on('change', (newValue) => {
	if (newValue == 'singles') playTypeDiv.innerHTML = 'Singles';
  if (newValue == 'doubles') playTypeDiv.innerHTML = 'Doubles';
}); */

const gridWidth = 10;
const squaresOn = 0.3; //1 is all squares on .35
const rngWeight = 0.5;
const avoidAdjacent = 0.8; //low values give less adjacent squares
const avoidCenter = 0.7; //high values give less center squares 1.6
const speed = 1200; //in ms
const addImages = 0.45;
const favorChessSquares = 1.9; //1.9
const squareColors: [number, number, number][] = [
	[173, 217, 255],
	[74, 170, 255],
	[0, 107, 203],
	[21, 55, 98],
	[0, 255, 0],
];
const imageNumber = 4;
let shownImages: number[] = [];
let imageIndex = 1;
let gridHeight = 0;
let onSquares: gridCell[] = [];
type gridCell = {
	centerDistance: number;
	score: number;
	element: HTMLTableDataCellElement;
	color: number;
	neighbors: gridCell[];
	adjacents: gridCell[];
	justRemoved: boolean;
	chessIndex: boolean;
	x: number;
	y: number;
	imageNumber: number;
};
let allCells: gridCell[] = [];
let squareLoop: NodeJS.Timeout | null;

function initGrid() {
	let blockDiv = document.getElementById('block-div')! as HTMLDivElement;
	let blockGrid = document.getElementById('block-grid')! as HTMLTableElement;
	let blockGround = document.getElementById('block-ground')! as HTMLDivElement;
	let smashcrew = document.getElementById('smashcrew')! as HTMLDivElement;
	let squareWidth = blockDiv.offsetWidth / gridWidth;
	gridHeight = Math.ceil(blockDiv.offsetHeight / squareWidth / 1) * 1;
	blockGrid.style.height = squareWidth * gridHeight + 'px';
	blockGround.style.height = squareWidth * gridHeight + 'px';
	blockGrid.style.top =
		(blockDiv.offsetHeight - blockGrid.offsetHeight) / 2 + 'px';
	blockGround.style.top =
		(blockDiv.offsetHeight - blockGrid.offsetHeight) / 2 + 'px';
	//smashcrew.style.transform = 'transla'
	/* blockGround.style.backgroundSize =
		'auto ' + (squareWidth * gridHeight - squareWidth * 3) + 'px'; */
	let banners = document.getElementsByClassName(
		'block-ground-banners'
	) as HTMLCollectionOf<HTMLDivElement>;
	for (let i = 0; i < banners.length; i++) {
		banners[i].style.height = squareWidth * .5 + 'px';
	}
	blockGrid.innerHTML = '';
	allCells = [];
	let cellGrid: gridCell[][] = [];
	for (let y = 0; y < gridHeight; y++) {
		let chessIndex = false;
		if (y / 2 == Math.round(y / 2)) chessIndex = true;
		let cellColumn: gridCell[] = [];
		let row = document.createElement('tr');
		for (let x = 0; x < gridWidth; x++) {
			let cell = document.createElement('td');
			cell.style.opacity = '0';
			row.appendChild(cell);
			let xDist = Math.abs(x - (gridWidth / 2 - 0.5));
			let yDist = Math.abs(y - (gridHeight / 2 - 0.5));
			let centerDistance = (xDist ** 2 + yDist ** 2) ** 0.5;
			let cellObj: gridCell = {
				centerDistance: centerDistance,
				score: 0,
				element: cell,
				color: -1,
				neighbors: [],
				adjacents: [],
				justRemoved: false,
				chessIndex: chessIndex,
				x: x,
				y: y,
				imageNumber: -1,
			};
			chessIndex = !chessIndex;
			allCells.push(cellObj);
			cellColumn.push(cellObj);
		}
		blockGrid.appendChild(row);
		cellGrid.push(cellColumn);
	}
	for (let y = 0; y < gridHeight; y++) {
		for (let x = 0; x < gridWidth; x++) {
			let cell = cellGrid[y][x];
			if (x > 0) cell.adjacents.push(cellGrid[y][x - 1]);
			if (x < gridWidth - 1) cell.adjacents.push(cellGrid[y][x + 1]);
			if (y > 0) cell.adjacents.push(cellGrid[y - 1][x]);
			if (y < gridHeight - 1) cell.adjacents.push(cellGrid[y + 1][x]);
			cell.neighbors = [...cell.adjacents];
			if (x > 0 && y > 0) cell.neighbors.push(cellGrid[y - 1][x - 1]);
			if (x > 0 && y < gridHeight - 1)
				cell.neighbors.push(cellGrid[y + 1][x - 1]);
			if (x < gridWidth - 1 && y > 0)
				cell.neighbors.push(cellGrid[y - 1][x + 1]);
			if (x < gridWidth - 1 && y < gridHeight - 1)
				cell.neighbors.push(cellGrid[y + 1][x + 1]);
		}
	}
	let squareOnNumber = Math.floor(gridHeight * gridWidth * squaresOn);
	for (let i = 0; i < squareOnNumber; i++) {
		addSquare();
	}
	if (squareLoop) {
		clearInterval(squareLoop);
		squareLoop = null;
	}
	squareLoop = setInterval(() => {
		addSquare();
		setTimeout(() => {
			removeSquare();
		}, speed);
	}, speed * 2);
}

function addSquare(cell?: gridCell) {
	if (cell == undefined) cell = getNextSquare();
	if (cell.color == -1) cell.color = 3;
	if (cell.color == 4) {
		while (shownImages.indexOf(imageIndex) != -1) {
			imageIndex++;
			if (imageIndex > imageNumber) imageIndex = 1;
		}
		cell.imageNumber = imageIndex;
		shownImages.push(imageIndex);
		cell.element.style.background =
			'url("./break-assets/icon' + imageIndex + '.png") no-repeat';
		cell.element.style.backgroundSize = 'cover';
		imageIndex++;
		if (imageIndex > imageNumber) imageIndex = 1;
	} else {
		let c = squareColors[cell.color];
		cell.element.style.background =
			'rgb(' + c[0] + ', ' + c[1] + ', ' + c[2] + ')';
		cell.element.style.backgroundSize = 'cover';
	}
	cell.element.style.animation = 'fade-in ' + speed + 'ms forwards';
	onSquares.push(cell);
}

function removeSquare() {
	let lowScore: number | null = null;
	let removeIndex = 0;
	for (let i = 0; i < onSquares.length; i++) {
		let ageFactor = i;
		let finalScore = onSquares[i].score * (ageFactor + 1);
		/* onSquares[i].element.innerHTML = (
			Math.round(finalScore * 10) / 10
		).toString(); */
		if (lowScore == null) lowScore = finalScore;
		if (finalScore < lowScore) {
			lowScore = finalScore;
			removeIndex = i;
		}
	}
	let cell = onSquares[removeIndex];
	onSquares.splice(removeIndex, 1);
	cell.justRemoved = true;
	if (cell.color == 4) {
		if (shownImages.indexOf(cell.imageNumber) != -1) {
			shownImages.splice(shownImages.indexOf(cell.imageNumber), 1);
		} else console.log('corrupt shownImages array');
	}
	cell.color = -1;
	cell.element.style.animation = 'fade-out ' + speed + 'ms forwards';
}

function getNextSquare(): gridCell {
	let highScore = 0;
	let returnIndex = 0;
	let image = false;
	let selectedCellNeighborColors: number[] = [];
	for (let i = 0; i < allCells.length; i++) {
		let maybeImage = false;
		let cell = allCells[i];
		let neighborWeight = 1;
		let adjacentCount = 0;
		cell.adjacents.forEach((cll) => {
			if (cll.color > -1 && cll.color < 4) {
				neighborWeight *= avoidAdjacent;
				adjacentCount++;
			}
		});
		if (
			adjacentCount == cell.adjacents.length &&
			cell.y > 0 &&
			cell.y < gridHeight - 1
		) {
			maybeImage = true;
			neighborWeight = addImages;
		}
		let neighborColors: number[] = [];
		cell.neighbors.forEach((cll) => {
			if (!neighborColors.includes(cll.color)) {
				neighborColors.push(cll.color);
			}
		});
		let ruleOut = 1;
		if (neighborColors.length > 3 && !maybeImage) ruleOut = 0;
		if (neighborColors.length == 0) ruleOut = 0;
		if (cell.color > -1) ruleOut = 0;
		if (cell.justRemoved) {
			ruleOut = 0;
			cell.justRemoved = false;
		}
		if (cell.color == 4 && adjacentCount != cell.adjacents.length)
			neighborWeight = 0;
		let chess = 1;
		if (cell.chessIndex || (!cell.chessIndex && maybeImage))
			chess = favorChessSquares;
		cell.score = cell.centerDistance ** avoidCenter * neighborWeight * chess;
		/* cell.element.innerHTML = Math.round(cell.score * 10).toString(); */
		let finalScore = Math.random() ** rngWeight * cell.score * ruleOut;
		if (finalScore > highScore) {
			highScore = finalScore;
			selectedCellNeighborColors = neighborColors;
			image = false;
			if (maybeImage) image = true;
			returnIndex = i;
		}
	}
	let colorOptions = [0, 1, 2, 3];
	selectedCellNeighborColors.forEach((color) => {
		const indexToDelete = colorOptions.indexOf(color);
		if (indexToDelete > -1) colorOptions.splice(indexToDelete, 1);
	});
	allCells[returnIndex].color =
		colorOptions[Math.floor(Math.random() * colorOptions.length)];
	if (image) allCells[returnIndex].color = 4;
	return allCells[returnIndex];
}

initGrid();
