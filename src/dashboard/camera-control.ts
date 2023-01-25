/// <reference path="../../../../types/browser.d.ts" />
const playTypeRep2 = nodecg.Replicant<playType>('playType');
const cameraRep = nodecg.Replicant<cameras>('camera');
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
	targets: {
		doubles: {
			positionX: 0,
			positionY: 0,
			width: 0,
			height: 0,
		},
		singles: {
			positionX: 0,
			positionY: 0,
			width: 0,
			height: 0,
		},
	},
	source: {
		sourceWidth: 0,
		sourceHeight: 0,
		scaleX: 1,
		cropTop: 0,
		cropRight: 0,
		cropBottom: 0,
		cropLeft: 0,
	},
};
let type: playType = 'singles';
let scene: 'game' | 'preGame' = 'game';
let camNo: 'cam1' | 'cam2' = 'cam1';
let horizStep = 0;
let vertStep = 0;
let step = 5;
calcStep();

function calcStep() {
	horizStep = Math.round((step * currentCamera.source.sourceWidth) / 500) / 2;
	vertStep = Math.round((step * currentCamera.source.sourceHeight) / 500) / 2;
}

numSwitch.oninput = () => {
	if (numSwitch.checked) {
		camNo = 'cam2';
	} else camNo = 'cam1';
	NodeCG.waitForReplicants(cameraRep).then(() => {
		mirrorSwitch.checked = cameraRep.value![scene][camNo].source.scaleX < 0;
		currentCamera = JSON.parse(JSON.stringify(cameraRep.value![scene][camNo]));
		calcStep();
	});
};

sceneSwitch.oninput = () => {
	if (sceneSwitch.checked) {
		scene = 'preGame';
	} else scene = 'game';
	NodeCG.waitForReplicants(cameraRep).then(() => {
		mirrorSwitch.checked = cameraRep.value![scene][camNo].source.scaleX < 0;
		currentCamera = JSON.parse(JSON.stringify(cameraRep.value![scene][camNo]));
		calcStep();
	});
};

mirrorSwitch.oninput = () => {
	const cameraChange: cameraChange = {
		scene: scene,
		item: camNo,
		camera: JSON.parse(JSON.stringify(cameraRep.value![scene][camNo].source)),
	};
	cameraChange.camera.scaleX = mirrorSwitch.checked ? -1 : 1;
	nodecg.sendMessage('cameraChange', cameraChange);
};

speed.oninput = () => {
	step = parseFloat(speed.value) ** 2;
	calcStep();
};

cameraRep.on('change', (newVal) => {
	currentCamera = JSON.parse(JSON.stringify(newVal[scene][camNo]));
	calcStep();
});
playTypeRep2.on('change', (newVal) => {
	type = newVal;
});

left.onclick = () => {
	let mm = 1;
	if (currentCamera.source.scaleX < 0) mm = -1;
	const check =
		mm > 0 ? currentCamera.source.cropLeft : currentCamera.source.cropRight;
	if (check > 0) {
		currentCamera.source.cropLeft -= horizStep * mm;
		currentCamera.source.cropRight += horizStep * mm;
		camChange();
	} else bump();
};
right.onclick = () => {
	let mm = 1;
	if (currentCamera.source.scaleX < 0) mm = -1;
	const check =
		mm > 0 ? currentCamera.source.cropRight : currentCamera.source.cropLeft;
	if (check > 0) {
		currentCamera.source.cropRight -= horizStep * mm;
		currentCamera.source.cropLeft += horizStep * mm;
		camChange();
	} else bump();
};
up.onclick = () => {
	if (currentCamera.source.cropTop > 0) {
		currentCamera.source.cropTop -= vertStep;
		currentCamera.source.cropBottom += vertStep;
		camChange();
	} else bump();
};
down.onclick = () => {
	if (currentCamera.source.cropBottom > 0) {
		currentCamera.source.cropBottom -= vertStep;
		currentCamera.source.cropTop += vertStep;
		camChange();
	} else bump();
};
zoomadd.onclick = () => {
	currentCamera.source.cropLeft += horizStep;
	currentCamera.source.cropRight += horizStep;
	currentCamera.source.cropTop += vertStep;
	currentCamera.source.cropBottom += vertStep;
	camChange();
};
zoomdec.onclick = () => {
	if (
		(currentCamera.source.cropLeft == 0 &&
			currentCamera.source.cropRight == 0) ||
		(currentCamera.source.cropTop == 0 && currentCamera.source.cropBottom == 0)
	) {
		bump();
	} else {
		currentCamera.source.cropLeft -= horizStep;
		currentCamera.source.cropRight -= horizStep;
		currentCamera.source.cropTop -= vertStep;
		currentCamera.source.cropBottom -= vertStep;
		camChange();
	}
};

updateCameras.onclick = () => {
	nodecg.sendMessage('updateCameras');
};

function camChange() {
	correctCam();
	//cameraRep.value![scene][camNo] = JSON.parse(JSON.stringify(currentCamera));
	let data: cameraChange = {
		scene: scene,
		item: camNo,
		camera: currentCamera.source,
	};
	calcStep();
	nodecg.sendMessage('cameraChange', data);
}

function correctCam() {
	makeCropPossible(currentCamera.source);
	const horizTotalCrop =
		currentCamera.source.cropLeft + currentCamera.source.cropRight;
	const vertTotalCrop =
		currentCamera.source.cropTop + currentCamera.source.cropBottom;
	const curWidth = currentCamera.source.sourceWidth - horizTotalCrop;
	const curHeight = currentCamera.source.sourceHeight - vertTotalCrop;
	const aspectRatio = curWidth / curHeight;
	const targetAspectRatio =
		currentCamera.targets[type].width / currentCamera.targets[type].height;
	let newWidth = curWidth;
	let newHeight = curHeight;
	if (aspectRatio > targetAspectRatio) {
		newWidth = Math.round(targetAspectRatio * curHeight);
	} else {
		newHeight = Math.round(curWidth / targetAspectRatio);
	}

	const newHorizCrop = currentCamera.source.sourceWidth - newWidth;
	const newVertCrop = currentCamera.source.sourceHeight - newHeight;
	let newCrop = {
		sourceWidth: currentCamera.source.sourceWidth,
		sourceHeight: currentCamera.source.sourceHeight,
		scaleX: currentCamera.source.scaleX,
		cropTop: 0,
		cropRight: 0,
		cropBottom: 0,
		cropLeft: 0,
	};
	if (horizTotalCrop > 0) {
		const horizCropCorrection = newHorizCrop / horizTotalCrop;
		newCrop.cropLeft =
			Math.round(currentCamera.source.cropLeft * horizCropCorrection * 2) / 2;
		newCrop.cropRight =
			Math.round(currentCamera.source.cropRight * horizCropCorrection * 2) / 2;
	} else {
		newCrop.cropLeft = Math.round(newHorizCrop) / 2;
		newCrop.cropRight = Math.round(newHorizCrop) / 2;
	}
	if (vertTotalCrop > 0) {
		const vertCropCorrection = newVertCrop / vertTotalCrop;
		newCrop.cropTop =
			Math.round(currentCamera.source.cropTop * vertCropCorrection * 2) / 2;
		newCrop.cropBottom =
			Math.round(currentCamera.source.cropBottom * vertCropCorrection * 2) / 2;
	} else {
		newCrop.cropTop = Math.round(newVertCrop) / 2;
		newCrop.cropBottom = Math.round(newVertCrop) / 2;
	}
	makeCropPossible(newCrop);
  currentCamera.source.cropLeft = newCrop.cropLeft;
  currentCamera.source.cropRight = newCrop.cropRight;
  currentCamera.source.cropTop = newCrop.cropTop;
  currentCamera.source.cropBottom = newCrop.cropBottom;
}

function makeCropPossible(crop: camera['source']) {
	if (crop.cropLeft < 0) crop.cropLeft = 0;
	if (crop.cropRight < 0) crop.cropRight = 0;
	if (crop.cropTop < 0) crop.cropTop = 0;
	if (crop.cropBottom < 0) crop.cropBottom = 0;
	const horizTotalCrop = crop.cropLeft + crop.cropRight;
	const horizCropCorrection =
		(currentCamera.source.sourceWidth - 2) / horizTotalCrop;
	if (horizCropCorrection < 1) {
		crop.cropLeft = Math.floor(crop.cropLeft * horizCropCorrection * 2) / 2;
		crop.cropRight = Math.floor(crop.cropRight * horizCropCorrection * 2) / 2;
	}
	const vertTotalCrop = crop.cropTop + crop.cropBottom;
	const vertCropCorrection =
		(currentCamera.source.sourceHeight - 2) / vertTotalCrop;
	if (vertCropCorrection < 1) {
		crop.cropTop = Math.floor(crop.cropTop * vertCropCorrection * 2) / 2;
		crop.cropBottom = Math.floor(crop.cropBottom * vertCropCorrection * 2) / 2;
	}
}

function bump() {
	document.body.style.backgroundColor = 'gray';
	setTimeout(() => {
		document.body.style.backgroundColor = '';
	}, 100);
}
