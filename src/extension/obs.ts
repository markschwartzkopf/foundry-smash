import { NodeCG } from '../../../../types/server';
import obsWebsocketJs from 'obs-websocket-js';
type obsSetItemProperties = obsWebsocketJs.SceneItemTransform & {
	'scene-name'?: string;
	item: { name?: string; id?: number };
};
const nodecg: NodeCG = require('./nodecg-api-context').get();

const obsStatusRep = nodecg.Replicant<obsStatus>('obs-status');
const switchAnimTriggerRep =
	nodecg.Replicant<switchAnimTrigger>('switch-trigger');
obsStatusRep.value = { status: 'disconnected', preview: null, program: null };
const playTypeRep = nodecg.Replicant<playType>('playType');
const cameraRep = nodecg.Replicant<cameras>('camera');
const mirrorRep = nodecg.Replicant<camMirrored>('mirror');
const obs = new obsWebsocketJs();
let obsAnimationQueue: {
	count: number;
	inAnimation: null | number;
	functionQueue: (() => void)[];
} = { count: 0, inAnimation: 0, functionQueue: [] };
let cameraInfo = require('./cameraInfo.json') as jsonCamInfo;
let allCameraItems: { item: string; sceneName: string }[] = [];
if (cameraInfo) {
	allCameraItems.push(cameraInfo.game.player1.source);
	allCameraItems.push(cameraInfo.game.player2.source);
	allCameraItems.push(cameraInfo.game.team1.source);
	allCameraItems.push(cameraInfo.game.team2.source);
	allCameraItems.push(cameraInfo.preGame.player1.source);
	allCameraItems.push(cameraInfo.preGame.player2.source);
	allCameraItems.push(cameraInfo.preGame.team1.source);
	allCameraItems.push(cameraInfo.preGame.team2.source);
}
let switchInCenter = {
	position: {
		y: 540,
	},
};

let bump: seObject = {
	position: {
		y: { start: 547, end: 540 },
	},
};

let switchFullScreen = {
	scale: {
		x: 2.456481456756592,
		y: 2.456481456756592,
	},
};

let switchPregame = {
	position: {
		x: 960,
		y: 834,
	},
	scale: {
		x: 1,
		y: 1,
	},
};

connectObs();

function connectObs() {
	if (obsStatusRep.value.status == 'connecting') {
		nodecg.log.info('Already tring to connect to OBS');
		return;
	}
	nodecg.log.info('Connecting to OBS...');
	obsStatusRep.value.status = 'connecting';
	let obsConnect = setInterval(() => {
		if (obsStatusRep.value.status == 'connecting') {
			obs
				.connect({ address: 'localhost:4444', password: 'pbmax' })
				.then(() => {
					obsStatusRep.value.status = 'connected';
					if (obsAnimationQueue.count == 0) {
						obsAnimationQueue.inAnimation = null;
						while (obsAnimationQueue.functionQueue.length > 0) {
							let func = obsAnimationQueue.functionQueue.shift()!;
							func();
						}
					}
					resetAll();
					nodecg.sendMessage('resetAll');
					obs.send('GetCurrentScene').then((currentSceneRes: obj) => {
						let program = currentSceneRes.name as string;
						obsStatusRep.value.program = program;
						obs
							.send('GetStudioModeStatus')
							.then((res: obj) => {
								if (res.studioMode) {
									obs
										.send('GetPreviewScene')
										.then((previewSceneRes: obj) => {
											let preview = previewSceneRes.name as string;
											obsStatusRep.value.preview = preview;
											nodecg.log.info(
												'OBS connected. Program: "' +
													program +
													'" Preview: "' +
													preview +
													'"'
											);
										})
										.catch((err) => {
											nodecg.log.error(err);
										});
								} else {
									obsStatusRep.value.preview = null;
									nodecg.log.info(
										'OBS connected. Program: "' +
											program +
											'" (Studio Mode is off)'
									);
								}
							})
							.then(() => {
								populateCameraRep();
							})
							.catch((err) => {
								nodecg.log.error(err);
							});
					});

					obs.on('SwitchScenes', (res: obj) => {
						obs.send('GetStudioModeStatus').then((res2: obj) => {
							if (!res2.studioMode && obsStatusRep.value.preview) {
								//console.log('rejecting pgm change to ' + res.sceneName)
								obsStatusRep.value.preview = null;
							} else {
								obsStatusRep.value.program = res.sceneName;
							}
						});
					});
					obs.on('PreviewSceneChanged', (res: obj) => {
						obsStatusRep.value.preview = res.sceneName;
					});
					obs.on('StudioModeSwitched', (res: obj) => {
						if (res.newState) {
							obs.send('GetPreviewScene').then((previewSceneRes: obj) => {
								obsStatusRep.value.preview = previewSceneRes.name;
							});
						} else {
							obsStatusRep.value.preview = null;
						}
					});
				})
				.catch((err: any) => {});
		} else clearInterval(obsConnect);
	}, 5000);
}

obs.on('ConnectionClosed', () => {
	if (obsStatusRep.value.status == 'connected') {
		obsStatusRep.value.status = 'disconnected';
		nodecg.log.info('OBS disconnected');
	}
});

nodecg.listenFor('connect', () => {
	if (obsStatusRep.value.status == 'disconnected') connectObs();
});

nodecg.listenFor('disconnect', () => {
	obsStatusRep.value.status = 'disconnected';
	obs.disconnect();
});

nodecg.listenFor('getOBSprops', (itemName: string, ack) => {
	if (obsStatusRep.value.status == 'connected') {
		obs
			.send('GetSceneItemProperties', { item: { name: itemName } })
			.then((ret: any) => {
				if (ack && !ack.handled) ack(null, ret);
			})
			.catch((err: any) => {
				if (ack && !ack.handled) ack(err);
			});
	} else nodecg.log.error('Cannot send commands to OBS unless connected');
});

nodecg.listenFor('toGame', () => {
	if (obsStatusRep.value.program != 'Pregame') {
		resetGame();
		obs.send('SetCurrentScene', { 'scene-name': 'Game' }).catch((err: any) => {
			nodecg.log.error(6);
			nodecg.log.error(err);
		});
		return;
	}
	getCurrentProps('Switch')
		.then((props) => {
			move(
				'Switch',
				Date.now(),
				1000,
				createSeObject(extractAnimProp(props), switchInCenter),
				() => {
					switchAnimTriggerRep.value = 'joyconsIn';
				}
			);
		})
		.catch((err) => {
			nodecg.log.error(2);
			nodecg.log.error(err);
		});
});
nodecg.listenFor('bumpSwitch', () => {
	if (obsStatusRep.value.status == 'connected') {
		move('Switch', Date.now(), 70, bump);
	} else nodecg.log.error('Cannot send commands to OBS unless connected');
});
nodecg.listenFor('gameStart', () => {
	if (obsStatusRep.value.status == 'connected') {
		let mm: 1 | -1 = 1;
		if (mirrorRep.value.cam1) mm = -1;
		let growIn: seObject = {
			scale: {
				x: { start: 0, end: cameraRep.value.game.player1.scale * mm },
				y: { start: 0, end: cameraRep.value.game.player1.scale },
			},
		};
		move('Player1', Date.now(), 300, growIn, () => {}, 'overshoot', 'GameCams');
	} else nodecg.log.error('Cannot send commands to OBS unless connected');
});
nodecg.listenFor('updateCameras', () => {
	obsDo(() => {
		populateCameraRep();
	});
});
nodecg.listenFor('cameraChange', (change: cameraChange) => {
	let itemName = cameraInfo[change.scene][change.item].source.item;
	let sceneName = cameraInfo[change.scene][change.item].source.sceneName;
	let scale = change.camera.scale;
	let num: 'cam1' | 'cam2' = 'cam1';
	if (change.item == 'player2' || change.item == 'team2') num = 'cam2';
	let xscale = scale;
	if (mirrorRep.value[num]) xscale *= -1;
	let args = {
		item: { name: itemName },
		'scene-name': sceneName,
		crop: change.camera.crop,
		scale: { x: xscale, y: scale },
	};
	obsDo(() => {
		obs.send('SetSceneItemProperties', args).catch((err) => {
			nodecg.log.error(err);
		});
	});
});
nodecg.listenFor('zoomToFullscreen', () => {
	resetGame();
	getCurrentProps('Switch')
		.then((props) => {
			move(
				'Switch',
				Date.now(),
				500,
				createSeObject(extractAnimProp(props), switchFullScreen),
				() => {
					obs
						.send('SetCurrentScene', { 'scene-name': 'Game' })
						.then(() => {
							nodecg.sendMessage('resetPregame');
						})
						.catch((err: any) => {
							nodecg.log.error(200);
							nodecg.log.error(err);
						});
				},
				'overshoot'
			);
		})
		.catch((err) => {
			nodecg.log.error(3);
			nodecg.log.error(err);
		});
});
nodecg.listenFor('resetPregame', () => {
	resetPregame();
});
nodecg.listenFor('resetAll', () => {
	resetAll();
});
playTypeRep.on('change', () => {
	resetPregame();
});
mirrorRep.on('change', () => {
	if (obsStatusRep.value.status == 'connected') setMirror();
});

function resetAll() {
	if (obsStatusRep.value.status == 'connected') {
		resetPregame();
		resetGame();
		populateCameraRep()
			.then(() => {
				setMirror();
			})
			.catch((err) => {
				nodecg.log.error(err);
			});
	}
}

function resetPregame() {
	let props: obsSetItemProperties = JSON.parse(JSON.stringify(switchPregame));
	if (playTypeRep.value == 'doubles') props.position!.y = 225;
	props.item = { name: 'Switch' };
	props['scene-name'] = 'Pregame';
	obsDo(() => {
		obs
			.send('SetSceneItemProperties', props)
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Player1' },
					'scene-name': 'Pregame',
					visible: playTypeRep.value == 'singles',
				});
			})
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Player2' },
					'scene-name': 'Pregame',
					visible: playTypeRep.value == 'singles',
				});
			})
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Team1' },
					'scene-name': 'Pregame',
					visible: playTypeRep.value == 'doubles',
				});
			})
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Team2' },
					'scene-name': 'Pregame',
					visible: playTypeRep.value == 'doubles',
				});
			})
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Player1' },
					'scene-name': 'GameCams',
					visible: playTypeRep.value == 'singles',
				});
			})
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Player2' },
					'scene-name': 'GameCams',
					visible: playTypeRep.value == 'singles',
				});
			})
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Team1' },
					'scene-name': 'GameCams',
					visible: playTypeRep.value == 'doubles',
				});
			})
			.then(() => {
				return obs.send('SetSceneItemProperties', {
					item: { name: 'Team2' },
					'scene-name': 'GameCams',
					visible: playTypeRep.value == 'doubles',
				});
			})
			.catch((err: any) => {
				nodecg.log.error(14);
				nodecg.log.error(JSON.stringify(err));
			});
	});
}

function setMirror() {
	obsDo(() => {
		let items: {
			item: string;
			sceneName: string;
			scaleX: number;
			scaleY: number;
		}[] = [];
		const scenes: ['game', 'preGame'] = ['game', 'preGame'];
		const cams: ['player1', 'player2', 'team1', 'team2'] = [
			'player1',
			'player2',
			'team1',
			'team2',
		];
		scenes.forEach((scene) => {
			cams.forEach((cam) => {
				let camNum: 'cam1' | 'cam2' = 'cam1';
				if (cam.slice(-1) == '2') camNum = 'cam2';
				let yscale = cameraRep.value[scene][cam].scale;
				let xscale = yscale;
				if (mirrorRep.value[camNum]) xscale *= -1;
				items.push({
					item: cameraInfo[scene][cam].source.item,
					sceneName: cameraInfo[scene][cam].source.sceneName,
					scaleX: xscale,
					scaleY: yscale,
				});
			});
		});
		sendMirror(items);
	});
}

function sendMirror(
	items: {
		item: string;
		sceneName: string;
		scaleX: number;
		scaleY: number;
	}[]
) {
	let item = items.shift();
	if (item) {
		obs
			.send('SetSceneItemProperties', {
				item: { name: item.item },
				'scene-name': item.sceneName,
				scale: { x: item.scaleX, y: item.scaleY },
			})
			.then(() => {
				sendMirror(items);
			});
	}
}

function resetGame() {
	//
}

function obsDo(func: () => void) {
	if (
		obsAnimationQueue.inAnimation == null &&
		obsStatusRep.value.status == 'connected'
	) {
		func();
	} else {
		obsAnimationQueue.functionQueue.push(func);
	}
}

function move(
	itemName: string,
	start: number,
	duration: number,
	transform: seObject,
	callback?: () => void,
	ease?: 'easeIn' | 'overshoot',
	sceneName?: string
) {
	let thisAnimation = obsAnimationQueue.count;
	obsAnimationQueue.inAnimation = thisAnimation;
	obsAnimationQueue.count++;
	let done = false;
	let progress = (Date.now() - start) / duration;
	if (progress >= 1) {
		progress = 1;
		done = true;
	}
	switch (ease) {
		case 'easeIn':
			progress = progress * progress;
			break;
		case 'overshoot':
			if (progress <= 0.444) {
				progress = 4 * progress ** 2;
			} else {
				let s = Math.sin(9 * Math.PI * progress);
				let r = Math.cos(Math.PI * progress) / 2 + 0.5;
				let t = (s * r) / 8;
				if (progress <= 0.5) {
					progress = 4 * progress ** 2 + t;
				} else progress = 1 + t;
			}
			break;
	}
	let props: any = deriveProps(progress, transform);
	props.item = itemName;
	if (sceneName) props['scene-name'] = sceneName;
	obs
		.send('SetSceneItemProperties', props)
		.then(() => {
			if (!done) {
				move(itemName, start, duration, transform, callback, ease, sceneName);
			} else {
				if (callback) callback();
				if (obsAnimationQueue.inAnimation == thisAnimation) {
					obsAnimationQueue.inAnimation = null;
					while (obsAnimationQueue.functionQueue.length > 0) {
						let func = obsAnimationQueue.functionQueue.shift()!;
						func();
					}
				}
			}
		})
		.catch((err: any) => {
			nodecg.log.error(4);
			nodecg.log.error(JSON.stringify(err));
		});
}

function deriveProps(progress: number, transform: seObject): animProp {
	// This will break if any OBS properties have both a "start" and "end" property
	// Also possibly broken by empty objects, which typing currently allows
	let rtn: animProp = {};
	for (const [key, value] of Object.entries(transform)) {
		if (value.hasOwnProperty('start') && value.hasOwnProperty('end')) {
			let start = value.start as number;
			let end = value.end as number;
			rtn[key] = start + (end - start) * progress;
		} else {
			let seObj = value as seObject;
			rtn[key] = deriveProps(progress, seObj);
		}
	}
	return rtn;
}

function createSeObject(start: animProp, end: animProp): seObject {
	let rtn: seObject = {};
	for (const [key, value] of Object.entries(end)) {
		if (start.hasOwnProperty(key)) {
			switch (typeof value) {
				case 'number':
					let startNum = start[key];
					if (typeof startNum == 'number') {
						rtn[key] = { start: startNum, end: value };
					} else
						nodecg.log.error(
							'Starting animProp incompatible with ending (num)'
						);
					break;
				case 'object':
					let startObj = start[key];
					if (typeof startObj == 'object') {
						rtn[key] = createSeObject(startObj, value);
					} else
						nodecg.log.error(
							'Starting animProp incompatible with ending (obj)'
						);
					break;
			}
		} else {
			nodecg.log.error('Starting animProp is missing properties');
		}
	}
	return rtn;
}

function extractAnimProp(input: object): animProp {
	let rtn: animProp = {};
	for (const [key, value] of Object.entries(input)) {
		switch (typeof value) {
			case 'number':
				rtn[key] = value;
				break;
			case 'object':
				rtn[key] = extractAnimProp(value);
				break;
		}
	}
	return rtn;
}

function getCurrentProps(itemName: string): Promise<object> {
	return new Promise((res, rej) => {
		if (obsStatusRep.value.status == 'connected') {
			obs
				.send('GetSceneItemProperties', { item: { name: itemName } })
				.then((rtn) => {
					res(rtn);
				})
				.catch((err: any) => {
					rej(err);
				});
		} else {
			rej('Cannot send commands to OBS unless connected');
		}
	});
}

function populateCameraRep() {
	return new Promise<void>((res, rej) => {
		getCameraInfo(
			cameraInfo.game.player1.target,
			cameraInfo.game.player1.source
		)
			.then((cam) => {
				if (!cam.source.x || !cam.source.y)
					cam.source = cameraRep.value.game.player1.source;
				if (cam.width > 0) mirrorRep.value.cam1 = false;
				if (cam.width < 0) mirrorRep.value.cam1 = true;
				cameraRep.value.game.player1 = cam;
				return getCameraInfo(
					cameraInfo.game.player2.target,
					cameraInfo.game.player2.source
				);
			})
			.then((cam) => {
				if (!cam.source.x || !cam.source.x)
					cam.source = cameraRep.value.game.player2.source;
				if (cam.width > 0) mirrorRep.value.cam2 = false;
				if (cam.width < 0) mirrorRep.value.cam2 = true;
				cameraRep.value.game.player2 = cam;
				return getCameraInfo(
					cameraInfo.game.team1.target,
					cameraInfo.game.team1.source
				);
			})
			.then((cam) => {
				if (!cam.source.x || !cam.source.x)
					cam.source = cameraRep.value.game.team1.source;
				if (cam.width > 0) mirrorRep.value.cam1 = false;
				if (cam.width < 0) mirrorRep.value.cam1 = true;
				cameraRep.value.game.team1 = cam;
				return getCameraInfo(
					cameraInfo.game.team2.target,
					cameraInfo.game.team2.source
				);
			})
			.then((cam) => {
				if (!cam.source.x || !cam.source.x)
					cam.source = cameraRep.value.game.team2.source;
				if (cam.width > 0) mirrorRep.value.cam2 = false;
				if (cam.width < 0) mirrorRep.value.cam2 = true;
				cameraRep.value.game.team2 = cam;
				return getCameraInfo(
					cameraInfo.preGame.player1.target,
					cameraInfo.preGame.player1.source
				);
			})
			.then((cam) => {
				if (!cam.source.x || !cam.source.x)
					cam.source = cameraRep.value.preGame.player1.source;
				cameraRep.value.preGame.player1 = cam;
				return getCameraInfo(
					cameraInfo.preGame.player2.target,
					cameraInfo.preGame.player2.source
				);
			})
			.then((cam) => {
				if (!cam.source.x || !cam.source.x)
					cam.source = cameraRep.value.preGame.player2.source;
				cameraRep.value.preGame.player2 = cam;
				return getCameraInfo(
					cameraInfo.preGame.team1.target,
					cameraInfo.preGame.team1.source
				);
			})
			.then((cam) => {
				if (!cam.source.x || !cam.source.x)
					cam.source = cameraRep.value.preGame.team1.source;
				cameraRep.value.preGame.team1 = cam;
				return getCameraInfo(
					cameraInfo.preGame.team2.target,
					cameraInfo.preGame.team2.source
				);
			})
			.then((cam) => {
				if (!cam.source.x || !cam.source.x)
					cam.source = cameraRep.value.preGame.team2.source;
				cameraRep.value.preGame.team2 = cam;
				res();
			})
			.catch((err) => {
				rej(err);
			});
	});
}

function getCameraInfo(
	reference: { item: string; sceneName: string },
	source: { item: string; sceneName: string }
): Promise<camera & { width?: number }> {
	return new Promise((res, rej) => {
		let rtn: preCamera = {};
		if (obsStatusRep.value.status == 'connected') {
			obs
				.send('GetSceneItemProperties', {
					item: { name: reference.item },
					'scene-name': reference.sceneName,
				})
				.then((ref) => {
					rtn.target = { x: ref.width, y: ref.height };
					return obs.send('GetSceneItemProperties', {
						item: { name: source.item },
						'scene-name': source.sceneName,
					});
				})
				.then((src) => {
					rtn.source = { x: src.sourceWidth, y: src.sourceHeight };
					rtn.crop = src.crop;
					rtn.scale = src.scale.y;
					rtn.width = src.width;
					let retrn = rtn as camera;
					res(retrn);
				})
				.catch((err) => {
					rej(err);
				});
		} else {
			rej('Must be connected to update camera info');
		}
	});
}
