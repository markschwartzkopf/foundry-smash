/// <reference path="../../../../types/browser.d.ts" />
const playTypeRep2 = nodecg.Replicant<playType>('playType');
const cameraRep = nodecg.Replicant<cameras>('camera');
const mirrorRep = nodecg.Replicant<camMirrored>('mirror');
let updateCameras = document.getElementById('update-cameras')!;
let left = document.getElementById('left')!;
let right = document.getElementById('right')!;
let up = document.getElementById('up')!;
let down = document.getElementById('down')!;
let zoomadd = document.getElementById('zoomadd')!;
let zoomdec = document.getElementById('zoomdec')!;
let speed = document.getElementById('speed')! as HTMLInputElement;
let numSwitch = document.getElementById('num')! as HTMLInputElement;
let sceneSwitch = document.getElementById('scene')! as HTMLInputElement;
let mirrorSwitch = document.getElementById('mirrored')! as HTMLInputElement;

let currentCamera: camera = {
	target: { x: 1, y: 1 },
	source: { x: 1, y: 1 },
	crop: { left: 0, right: 0, top: 0, bottom: 0 },
	scale: 1,
	width: 1,
};
let currentMirror = true;
let num: 1 | 2 = 1;
let type: playType = 'singles';
let scene: 'game' | 'preGame' = 'game';
let key2: 'player1' | 'player2' | 'team1' | 'team2' = 'player1';
let step = 5;

numSwitch.oninput = () => {
	if (numSwitch.checked) {
		num = 2;
	} else num = 1;
	updateKey2();
	NodeCG.waitForReplicants(mirrorRep).then(() => {
		let cam: 'cam1' | 'cam2' = 'cam1';
		if (num == 2) cam = 'cam2';
		mirrorSwitch.checked = mirrorRep.value![cam];
	});
};

sceneSwitch.oninput = () => {
	if (sceneSwitch.checked) {
		scene = 'preGame';
	} else scene = 'game';
	updateKey2();
};

mirrorSwitch.oninput = () => {
	let cam: 'cam1' | 'cam2' = 'cam1';
	if (num == 2) cam = 'cam2';
	mirrorRep.value![cam] = mirrorSwitch.checked;
};

speed.oninput = () => {
	step = parseFloat(speed.value) ** 2;
};

cameraRep.on('change', (newVal) => {
	currentCamera = JSON.parse(JSON.stringify(newVal[scene][key2]));
});
playTypeRep2.on('change', (newVal) => {
	type = newVal;
	updateKey2();
});
mirrorRep.on('change', (newVal) => {
	let cam: 'cam1' | 'cam2' = 'cam1';
	if (num == 2) cam = 'cam2';
  currentMirror = newVal[cam]
	mirrorSwitch.checked = currentMirror;
});

left.onclick = () => {
  let mm = 1;
  if (currentMirror) mm = -1;
	currentCamera.crop.left -= (step * currentCamera.source.y) / 1000 * mm;
	currentCamera.crop.right += (step * currentCamera.source.y) / 1000 * mm;
	camChange();
};
right.onclick = () => {
  let mm = 1;
  if (currentMirror) mm = -1;
	currentCamera.crop.right -= (step * currentCamera.source.y) / 1000 * mm;
	currentCamera.crop.left += (step * currentCamera.source.y) / 1000 * mm;
	camChange();
};
up.onclick = () => {
	currentCamera.crop.top -= (step * currentCamera.source.y) / 1000;
	currentCamera.crop.bottom += (step * currentCamera.source.y) / 1000;
	camChange();
};
down.onclick = () => {
	currentCamera.crop.bottom -= (step * currentCamera.source.y) / 1000;
	currentCamera.crop.top += (step * currentCamera.source.y) / 1000;
	camChange();
};
zoomadd.onclick = () => {
	currentCamera.scale *= 1 + step / 40;
	camChange();
};
zoomdec.onclick = () => {
	currentCamera.scale /= 1 + step / 40;
	camChange();
};

updateCameras.onclick = () => {
	nodecg.sendMessage('updateCameras');
};

function camChange() {
	correctCam();
	console.log(JSON.stringify(currentCamera.crop) + ' ' + currentCamera.scale);
	cameraRep.value![scene][key2] = JSON.parse(JSON.stringify(currentCamera));
	let data: cameraChange = { scene: scene, item: key2, camera: currentCamera };
	nodecg.sendMessage('cameraChange', data);
}

function correctCam() {
	let smallestXScale = currentCamera.target.x / currentCamera.source.x;
	let smallestYScale = currentCamera.target.y / currentCamera.source.y;
	let smallestScale = Math.max(smallestXScale, smallestYScale);
	if (currentCamera.scale < smallestScale) currentCamera.scale = smallestScale;
	let cropLeftRight = currentCamera.crop.left + currentCamera.crop.right;
	let cropLeft: number;
	let cropRight: number;
	if (cropLeftRight > 0) {
		cropLeft = currentCamera.crop.left / cropLeftRight;
		cropRight = currentCamera.crop.right / cropLeftRight;
	} else {
		cropLeft = 0.5;
		cropRight = 0.5;
	}
	let cropTopBottom = currentCamera.crop.top + currentCamera.crop.bottom;
	let cropTop: number;
	let cropBottom: number;
	if (cropTopBottom > 0) {
		cropTop = currentCamera.crop.top / cropTopBottom;
		cropBottom = currentCamera.crop.bottom / cropTopBottom;
	} else {
		cropTop = 0.5;
		cropBottom = 0.5;
	}
	if (cropLeft < 0) {
		cropLeft = 0;
		cropRight = 1;
		bump();
	}
	if (cropRight < 0) {
		cropLeft = 1;
		cropRight = 0;
		bump();
	}
	if (cropTop < 0) {
		cropTop = 0;
		cropBottom = 1;
		bump();
	}
	if (cropBottom < 0) {
		cropTop = 1;
		cropBottom = 0;
		bump();
	}
	let newX = currentCamera.source.x * currentCamera.scale;
	cropLeftRight = (newX - currentCamera.target.x) / currentCamera.scale;
	currentCamera.crop.left = cropLeftRight * cropLeft;
	currentCamera.crop.right = cropLeftRight * cropRight;

	let newY = currentCamera.source.y * currentCamera.scale;
	cropTopBottom = (newY - currentCamera.target.y) / currentCamera.scale;
	currentCamera.crop.top = cropTopBottom * cropTop;
	currentCamera.crop.bottom = cropTopBottom * cropBottom;
}

function updateKey2() {
	if (type == 'singles') {
		if (num == 1) {
			key2 = 'player1';
		} else key2 = 'player2';
	} else {
		if (num == 1) {
			key2 = 'team1';
		} else key2 = 'team2';
	}
	NodeCG.waitForReplicants(cameraRep).then(() => {
		currentCamera = JSON.parse(JSON.stringify(cameraRep.value![scene][key2]));
	});
}

function bump() {
	document.body.style.backgroundColor = 'gray';
	setTimeout(() => {
		document.body.style.backgroundColor = '';
	}, 100);
}
