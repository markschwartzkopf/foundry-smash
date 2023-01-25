import { NodeCG } from '../../../../types/server';
import obsWebsocketJs from 'obs-websocket-js';

const nodecg: NodeCG = require('./nodecg-api-context').get();
const obsStatusRep = nodecg.Replicant<obsStatus>('obs-status');
const switchAnimTriggerRep =
	nodecg.Replicant<switchAnimTrigger>('switch-trigger');
obsStatusRep.value = { status: 'disconnected', preview: null, program: null };
const playTypeRep = nodecg.Replicant<playType>('playType');
const cameraRep = nodecg.Replicant<cameras>('camera');
const obsPassword = nodecg.bundleConfig.obsPassword;
const obs = new obsWebsocketJs();
let obsAnimationQueue: {
	count: number;
	inAnimation: null | number;
	functionQueue: (() => void)[];
} = { count: 0, inAnimation: 0, functionQueue: [] };
const cameraInfo: JsonCamInfo = {
	game: {
		cam1: {
			targets: {
				singles: {
					sourceName: 'Player1Reference',
					sceneName: 'GameCams',
					sceneItemId: 0,
				},
				doubles: {
					sourceName: 'Team1Reference',
					sceneName: 'GameCams',
					sceneItemId: 0,
				},
			},
			source: {
				sourceName: 'BM1',
				sceneName: 'GameCams',
				sceneItemId: 0,
			},
		},
		cam2: {
			targets: {
				singles: {
					sourceName: 'Player2Reference',
					sceneName: 'GameCams',
					sceneItemId: 0,
				},
				doubles: {
					sourceName: 'Team2Reference',
					sceneName: 'GameCams',
					sceneItemId: 0,
				},
			},
			source: {
				sourceName: 'BM2',
				sceneName: 'GameCams',
				sceneItemId: 0,
			},
		},
	},
	preGame: {
		cam1: {
			targets: {
				singles: {
					sourceName: 'Player1Reference',
					sceneName: 'PregameCams',
					sceneItemId: 0,
				},
				doubles: {
					sourceName: 'Team1Reference',
					sceneName: 'PregameCams',
					sceneItemId: 0,
				},
			},
			source: {
				sourceName: 'BM1',
				sceneName: 'PregameCams',
				sceneItemId: 0,
			},
		},
		cam2: {
			targets: {
				singles: {
					sourceName: 'Player2Reference',
					sceneName: 'PregameCams',
					sceneItemId: 0,
				},
				doubles: {
					sourceName: 'Team2Reference',
					sceneName: 'PregameCams',
					sceneItemId: 0,
				},
			},
			source: {
				sourceName: 'BM2',
				sceneName: 'PregameCams',
				sceneItemId: 0,
			},
		},
	},
};
const switchInfo: JsonObsItem = {
	sourceName: 'Switch',
	sceneName: 'SwitchScene',
	sceneItemId: -1,
};
let allCameraItems: JsonObsItem[] = [];
allCameraItems.push(cameraInfo.game.cam1.source);
allCameraItems.push(cameraInfo.game.cam2.source);
allCameraItems.push(cameraInfo.preGame.cam1.source);
allCameraItems.push(cameraInfo.preGame.cam2.source);
let screenWidth = 1280;
let switchInCenter: Partial<ObsSceneItemTransform> = {
	positionY: 0.2813,
};

let bumpStart: Partial<ObsSceneItemTransform> = {
	positionY: 0.289,
};
let bumpEnd: Partial<ObsSceneItemTransform> = {
	positionY: 0.2813,
};

let switchFullScreen: Partial<ObsSceneItemTransform> = {
	scaleX: 2.456481456756592,
	scaleY: 2.456481456756592,
};

let switchPregameSingles: Partial<ObsSceneItemTransform> = {
	positionX: 0.5,
	positionY: 0.4344,
	scaleX: 1,
	scaleY: 1,
};
let switchPregameDoubles: Partial<ObsSceneItemTransform> = {
	positionX: 0.5,
	positionY: 0.1219,
	scaleX: 1,
	scaleY: 1,
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
				.connect('ws://127.0.0.1:4455', obsPassword)
				.then(() => {
					nodecg.log.info('obs connected');
					obsStatusRep.value.status = 'connected';
					if (obsAnimationQueue.count == 0) {
						obsAnimationQueue.inAnimation = null;
						while (obsAnimationQueue.functionQueue.length > 0) {
							let func = obsAnimationQueue.functionQueue.shift()!;
							func();
						}
					}
					populateIds()
						.then(() => {
							return obs.call('GetVideoSettings');
						})
						.then((data) => {
							screenWidth = data.baseWidth;
							return obs.call('GetSceneList');
						})
						.then((sceneList) => {
							obsStatusRep.value.program = sceneList.currentProgramSceneName;
							obsStatusRep.value.preview = sceneList.currentPreviewSceneName;
							nodecg.log.info(
								'OBS connected. Program: "' +
									sceneList.currentProgramSceneName +
									'" Preview: "' +
									sceneList.currentPreviewSceneName +
									'"'
							);
						})
						.then(() => {
							return populateCameraRep();
						})
						.then(() => {
							nodecg.sendMessage('resetAll');
						})
						.catch((err) => {
							myError(err);
						});

					obs.on('CurrentProgramSceneChanged', (res) => {
						obsStatusRep.value.program = res.sceneName;
					});
					obs.on('CurrentPreviewSceneChanged', (res) => {
						obsStatusRep.value.preview = res.sceneName;
					});
					obs.on('StudioModeStateChanged', (res) => {
						if (res.studioModeEnabled) {
							obs.call('GetCurrentPreviewScene').then((res) => {
								obsStatusRep.value.preview = res.currentPreviewSceneName;
							});
						} else obsStatusRep.value.preview = null;
					});
				})
				.catch((err) => {
					if (err.code != 'CONNECTION_ERROR') myError(err);
				});
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
	if (obsStatusRep.value.status == 'connected' && obsStatusRep.value.program) {
		obs
			.call('GetSceneItemList', { sceneName: obsStatusRep.value.program })
			.then((data) => {
				const sceneItem = data.sceneItems.filter((x) => {
					return x.sourceName === itemName;
				})[0];
				const itemId =
					sceneItem &&
					sceneItem.sceneItemId &&
					typeof sceneItem.sceneItemId === 'number'
						? sceneItem.sceneItemId
						: 0;
				return obs.call('GetSceneItemTransform', {
					sceneName: obsStatusRep.value.program!,
					sceneItemId: itemId,
				});
			})
			.then((ret: any) => {
				if (ack && !ack.handled) ack(null, ret);
			})
			.catch((err: any) => {
				if (ack && !ack.handled) ack(err);
			});
	} else myError('Cannot send commands to OBS unless connected');
});

nodecg.listenFor('toGame', () => {
	clearGame();
	if (obsStatusRep.value.program != 'Pregame') {
		obs
			.call('SetCurrentProgramScene', { sceneName: 'Game' })
			.catch((err: any) => {
				myError(err);
			});
		return;
	}
	getCurrentProps(switchInfo)
		.then((transform) => {
			move(
				switchInfo,
				Date.now(),
				1000,
				createSeObject(transform, percentToPixels(switchInCenter)),
				() => {
					switchAnimTriggerRep.value = 'joyconsIn';
				}
			);
		})
		.catch((err) => {
			myError(err);
		});
});

nodecg.listenFor('bumpSwitch', () => {
	if (obsStatusRep.value.status == 'connected') {
		move(
			switchInfo,
			Date.now(),
			70,
			createSeObject(percentToPixels(bumpStart), percentToPixels(bumpEnd))
		);
	} else myError('Cannot send commands to OBS unless connected');
});

nodecg.listenFor('gameStart', () => {
	if (obsStatusRep.value.status == 'connected') {
		const growIn: seObject = {
			boundsWidth: {
				start: 1,
				end: cameraRep.value.game.cam1.targets[playTypeRep.value].width,
			},
			boundsHeight: {
				start: 1,
				end: cameraRep.value.game.cam1.targets[playTypeRep.value].height,
			},
		};
		const shrunk: Partial<ObsSceneItemTransform> = {
			boundsWidth: 1,
			boundsHeight: 1,
		};
		const duration = 300;
		const delay = 100;
		obs
			.call('SetSceneItemTransform', {
				sceneName: cameraInfo.game.cam1.source.sceneName,
				sceneItemId: cameraInfo.game.cam1.source.sceneItemId,
				sceneItemTransform: shrunk,
			})
			.then(() => {
				return obs.call('SetSceneItemTransform', {
					sceneName: cameraInfo.game.cam2.source.sceneName,
					sceneItemId: cameraInfo.game.cam2.source.sceneItemId,
					sceneItemTransform: shrunk,
				});
			})
			.then(() => {
				return obs.call('SetSceneItemEnabled', {
					sceneName: cameraInfo.game.cam1.source.sceneName,
					sceneItemId: cameraInfo.game.cam1.source.sceneItemId,
					sceneItemEnabled: true,
				});
			})
			.then(() => {
				return obs.call('SetSceneItemEnabled', {
					sceneName: cameraInfo.game.cam2.source.sceneName,
					sceneItemId: cameraInfo.game.cam2.source.sceneItemId,
					sceneItemEnabled: true,
				});
			})
			.then(() => {
				move(
					cameraInfo.game.cam1.source,
					Date.now(),
					duration,
					growIn,
					() => {},
					'overshoot'
				);
				setTimeout(() => {
					move(
						cameraInfo.game.cam2.source,
						Date.now(),
						duration,
						growIn,
						() => {},
						'overshoot'
					);
				}, duration + delay);
				setTimeout(() => {
					nodecg.sendMessage('gameOverlayIn');
				}, duration + delay + duration);
			})
			.catch((err) => {
				myError(JSON.stringify(err));
			});
	} else myError('Cannot send commands to OBS unless connected');
});

nodecg.listenFor('updateCameras', () => {
	obsDo(() => {
		populateCameraRep()
			.then(() => {
				refreshCameraLocations();
			})
			.catch((err) => {
				myError(err);
			});
	});
});

nodecg.listenFor('cameraChange', (change: cameraChange) => {
	let cam = cameraInfo[change.scene][change.item].source;
	let transform: Partial<ObsSceneItemTransform> = change.camera;
	obsDo(() => {
		obs
			.call('SetSceneItemTransform', {
				sceneName: cam.sceneName,
				sceneItemId: cam.sceneItemId,
				sceneItemTransform: transform,
			})
			.then(() => {
				cameraRep.value[change.scene][change.item].source = change.camera;
			})
			.catch((err) => {
				myError(err);
			});
	});
});

nodecg.listenFor('zoomToFullscreen', () => {
	getCurrentProps(switchInfo)
		.then((props) => {
			move(
				switchInfo,
				Date.now(),
				500,
				createSeObject(props, percentToPixels(switchFullScreen)),
				() => {
					obs
						.call('SetCurrentProgramScene', { sceneName: 'Game' })
						.then(() => {
							setTimeout(() => {
								nodecg.sendMessage('resetPregame');
							}, 500);
						})
						.catch((err: any) => {
							myError(err);
						});
				},
				'overshoot'
			);
		})
		.catch((err) => {
			myError(err);
		});
});

nodecg.listenFor('resetPregame', () => {
	resetPregame();
	refreshCameraLocations();
});

nodecg.listenFor('resetAll', () => {
	resetAll();
});

playTypeRep.on('change', () => {
	refreshCameraLocations();
	resetPregame();
});

function clearGame() {
	return new Promise<void>((res, rej) => {
		if (obsStatusRep.value.status == 'connected') {
			obs
				.call('SetSceneItemEnabled', {
					sceneName: cameraInfo.game.cam1.source.sceneName,
					sceneItemId: cameraInfo.game.cam1.source.sceneItemId,
					sceneItemEnabled: false,
				})
				.then(() => {
					return obs.call('SetSceneItemEnabled', {
						sceneName: cameraInfo.game.cam2.source.sceneName,
						sceneItemId: cameraInfo.game.cam2.source.sceneItemId,
						sceneItemEnabled: false,
					});
				})
				.then(() => {
					res();
				})
				.catch((err) => {
					rej(new Error(err).stack);
				});
		} else rej(new Error('OBS not connected').stack);
		nodecg.sendMessage('zeroGame');
	});
}

function resetAll() {
	if (obsStatusRep.value.status == 'connected') {
		populateIds()
			.then(() => {
				return populateCameraRep();
			})
			.then(() => {
				refreshCameraLocations();
			})
			.catch((err) => {
				myError(err);
			});
	}
}

function resetPregame() {
	if (obsStatusRep.value.status === 'connected') {
		const switchTransform = percentToPixels(
			playTypeRep.value === 'singles'
				? switchPregameSingles
				: switchPregameDoubles
		);
		obsDo(() => {
			obs
				.call('SetSceneItemTransform', {
					sceneName: switchInfo.sceneName,
					sceneItemId: switchInfo.sceneItemId,
					sceneItemTransform: switchTransform,
				})
				.catch((err: any) => {
					myError(JSON.stringify(err));
				});
		});
	}
}

function refreshCameraLocations() {
	if (obsStatusRep.value.status === 'connected') {
		obsDo(async () => {
			function generateTransform(
				scene: 'game' | 'preGame',
				cam: 'cam1' | 'cam2'
			) {
				return {
					sceneName: cameraInfo[scene][cam].source.sceneName,
					sceneItemId: cameraInfo[scene][cam].source.sceneItemId,
					sceneItemTransform: {
						positionX:
							cameraRep.value[scene][cam].targets[playTypeRep.value].positionX,
						positionY:
							cameraRep.value[scene][cam].targets[playTypeRep.value].positionY,
						boundsWidth:
							cameraRep.value[scene][cam].targets[playTypeRep.value].width,
						boundsHeight:
							cameraRep.value[scene][cam].targets[playTypeRep.value].height,
						...refreshedAspectRatioCrop(cameraRep.value[scene][cam]),
					},
				};
			}
			const transforms: {
				sceneName: string;
				sceneItemId: number;
				sceneItemTransform: Partial<ObsSceneItemTransform>;
			}[] = [
				generateTransform('game', 'cam1'),
				generateTransform('game', 'cam2'),
				generateTransform('preGame', 'cam1'),
				generateTransform('preGame', 'cam2'),
			];
			for (let i = 0; i < transforms.length; i++) {
				await obs.call('SetSceneItemTransform', transforms[i]).catch((err) => {
					myError(err);
				});
			}
		});
	}
}

function refreshedAspectRatioCrop(cam: camera): {
	cropTop: number;
	cropRight: number;
	cropBottom: number;
	cropLeft: number;
} {
	let rtn = {
		cropTop: cam.source.cropTop,
		cropRight: cam.source.cropRight,
		cropBottom: cam.source.cropBottom,
		cropLeft: cam.source.cropLeft,
	};
	let cropX = rtn.cropLeft + rtn.cropRight;
	let width = cam.source.sourceWidth - cropX;
	let cropY = rtn.cropTop + rtn.cropBottom;
	let height = cam.source.sourceHeight - cropY;
	const targetRatio =
		cam.targets[playTypeRep.value].width /
		cam.targets[playTypeRep.value].height;
	let currentRatio = width / height;
	let additionalCroppingNeeded = false;
	//uncrop:
	if (currentRatio > targetRatio) {
		let newHeight = width / targetRatio;
		let cropRemove = newHeight - height;
		rtn.cropTop -= Math.round(cropRemove / 2);
		rtn.cropBottom -= Math.round(cropRemove / 2);
		if (rtn.cropTop < 0) {
			rtn.cropBottom += rtn.cropTop;
			rtn.cropTop = 0;
		}
		if (rtn.cropBottom < 0) {
			rtn.cropTop += rtn.cropBottom;
			rtn.cropBottom = 0;
		}
		if (rtn.cropTop < 0 || rtn.cropBottom < 0) {
			rtn.cropTop = 0;
			rtn.cropBottom = 0;
			additionalCroppingNeeded = true;
		}
	} else {
		let newWidth = targetRatio * height;
		let cropRemove = newWidth - width;
		rtn.cropLeft -= Math.round(cropRemove / 2);
		rtn.cropRight -= Math.round(cropRemove / 2);
		if (rtn.cropLeft < 0) {
			rtn.cropRight += rtn.cropLeft;
			rtn.cropLeft = 0;
		}
		if (rtn.cropRight < 0) {
			rtn.cropLeft += rtn.cropRight;
			rtn.cropRight = 0;
		}
		if (rtn.cropLeft < 0 || rtn.cropRight < 0) {
			rtn.cropLeft = 0;
			rtn.cropRight = 0;
			additionalCroppingNeeded = true;
		}
	}
	//crop:
	if (additionalCroppingNeeded) {
		cropX = rtn.cropLeft + rtn.cropRight;
		width = cam.source.sourceWidth - cropX;
		cropY = rtn.cropTop + rtn.cropBottom;
		height = cam.source.sourceHeight - cropY;
		if (currentRatio > targetRatio) {
			let newWidth = targetRatio * height;
			let cropAdd = width - newWidth;
			rtn.cropLeft += Math.round(cropAdd / 2);
			rtn.cropRight += Math.round(cropAdd / 2);
		} else {
			let newHeight = width / targetRatio;
			let cropAdd = height - newHeight;
			rtn.cropTop += Math.round(cropAdd / 2);
			rtn.cropBottom += Math.round(cropAdd / 2);
		}
	}
	return rtn;
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
	item: JsonObsItem,
	start: number,
	duration: number,
	transform: seObject,
	callback?: () => void,
	ease?: 'easeIn' | 'overshoot',
	thisAnimation?: number
) {
	if (!thisAnimation && thisAnimation != 0) {
		thisAnimation = obsAnimationQueue.count;
		obsAnimationQueue.inAnimation = thisAnimation;
		obsAnimationQueue.count++;
	}
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
	let props = deriveProps(progress, transform);
	obs
		.call('SetSceneItemTransform', {
			sceneName: item.sceneName,
			sceneItemId: item.sceneItemId,
			sceneItemTransform: props,
		})
		.then(() => {
			if (!done) {
				move(item, start, duration, transform, callback, ease, thisAnimation);
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
			myError(JSON.stringify(err));
		});
}

function deriveProps(
	progress: number,
	transform: seObject
): Partial<ObsSceneItemTransform> {
	let rtn: Partial<ObsSceneItemTransform> = {};
	for (const [key, value] of Object.entries(transform)) {
		let start = value.start as number;
		let end = value.end as number;
		rtn[key as keyof seObject] = start + (end - start) * progress;
	}
	return rtn;
}

function createSeObject(
	start: Partial<ObsSceneItemTransform>,
	end: Partial<ObsSceneItemTransform>
): seObject {
	let rtn: seObject = {};
	for (const [key, value] of Object.entries(end)) {
		if (start.hasOwnProperty(key)) {
			let startNum = start[key as keyof ObsSceneItemTransform];
			if (typeof startNum == 'number') {
				rtn[key as keyof ObsSceneItemTransform] = {
					start: startNum,
					end: value,
				};
			} else myError('Starting animProp incompatible with ending (num)');
		} else {
			myError('Starting transform is missing properties');
		}
	}
	return rtn;
}

/* I think this is for nested properties that no longer exist in 5.0
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
} */

function getCurrentProps(item: JsonObsItem): Promise<ObsSceneItemTransform> {
	return new Promise((res, rej) => {
		if (obsStatusRep.value.status == 'connected') {
			obs
				.call('GetSceneItemTransform', item)
				.then((rtn) => {
					res(rtn.sceneItemTransform as ObsSceneItemTransform);
				})
				.catch((err: any) => {
					rej(err);
				});
		} else {
			rej('Cannot send commands to OBS unless connected');
		}
	});
}

function populateIds() {
	return new Promise<void>((res, rej) => {
		function checkSourceName(
			obsSource: JsonObsItem,
			item: { sourceName?: string; sceneItemId?: number }
		) {
			if (
				obsSource.sourceName === item.sourceName &&
				typeof item.sceneItemId === 'number'
			)
				obsSource.sceneItemId = item.sceneItemId;
		}
		obs
			.call('GetSceneItemList', { sceneName: 'GameCams' })
			.then((items) => {
				for (let i = 0; i < items.sceneItems.length; i++) {
					const item = items.sceneItems[i];
					checkSourceName(cameraInfo.game.cam1.targets.singles, item);
					checkSourceName(cameraInfo.game.cam1.targets.doubles, item);
					checkSourceName(cameraInfo.game.cam1.source, item);
					checkSourceName(cameraInfo.game.cam2.targets.singles, item);
					checkSourceName(cameraInfo.game.cam2.targets.doubles, item);
					checkSourceName(cameraInfo.game.cam2.source, item);
				}
				return obs.call('GetSceneItemList', { sceneName: 'PregameCams' });
			})
			.then((items) => {
				for (let i = 0; i < items.sceneItems.length; i++) {
					const item = items.sceneItems[i];
					checkSourceName(cameraInfo.preGame.cam1.targets.singles, item);
					checkSourceName(cameraInfo.preGame.cam1.targets.doubles, item);
					checkSourceName(cameraInfo.preGame.cam1.source, item);
					checkSourceName(cameraInfo.preGame.cam2.targets.singles, item);
					checkSourceName(cameraInfo.preGame.cam2.targets.doubles, item);
					checkSourceName(cameraInfo.preGame.cam2.source, item);
				}
				return obs.call('GetSceneItemList', {
					sceneName: switchInfo.sceneName,
				});
			})
			.then((items) => {
				const sceneItem = items.sceneItems.filter((x) => {
					return x.sourceName === switchInfo.sourceName;
				})[0];
				const itemId =
					sceneItem &&
					sceneItem.sceneItemId &&
					typeof sceneItem.sceneItemId === 'number'
						? sceneItem.sceneItemId
						: 0;
				switchInfo.sceneItemId = itemId;
				res();
			})
			.catch((err) => {
				rej(err);
			});
	});
}

function populateCameraRep() {
	return new Promise<void>((res, rej) => {
		getCameraInfo(
			cameraInfo.game.cam1.targets.doubles,
			cameraInfo.game.cam1.targets.singles,
			cameraInfo.game.cam1.source
		)
			.then((cam) => {
				cameraRep.value.game.cam1 = cam;
				return getCameraInfo(
					cameraInfo.game.cam2.targets.doubles,
					cameraInfo.game.cam2.targets.singles,
					cameraInfo.game.cam2.source
				);
			})
			.then((cam) => {
				cameraRep.value.game.cam2 = cam;
				return getCameraInfo(
					cameraInfo.preGame.cam1.targets.doubles,
					cameraInfo.preGame.cam1.targets.singles,
					cameraInfo.preGame.cam1.source
				);
			})
			.then((cam) => {
				cameraRep.value.preGame.cam1 = cam;
				return getCameraInfo(
					cameraInfo.preGame.cam2.targets.doubles,
					cameraInfo.preGame.cam2.targets.singles,
					cameraInfo.preGame.cam2.source
				);
			})
			.then((cam) => {
				cameraRep.value.preGame.cam2 = cam;
				res();
			})
			.catch((err) => {
				rej(err);
			});
	});
}

function getCameraInfo(
	referenceDoubles: JsonCamInfo['game']['cam1']['targets']['doubles'],
	referenceSingles: JsonCamInfo['game']['cam1']['targets']['singles'],
	source: JsonCamInfo['game']['cam1']['source']
): Promise<camera> {
	return new Promise((res, rej) => {
		let rtn: camera = {
			targets: {
				doubles: { positionX: 0, positionY: 0, width: 0, height: 0 },
				singles: { positionX: 0, positionY: 0, width: 0, height: 0 },
			},
			source: {
				sourceWidth: 0,
				sourceHeight: 0,
				cropTop: 0,
				cropRight: 0,
				cropBottom: 0,
				cropLeft: 0,
				scaleX: 1,
			},
		};
		if (
			obsStatusRep.value.status == 'connected' &&
			referenceDoubles.sceneItemId &&
			referenceSingles.sceneItemId &&
			source.sceneItemId
		) {
			obs
				.call('GetSceneItemTransform', {
					sceneItemId: referenceDoubles.sceneItemId,
					sceneName: referenceDoubles.sceneName,
				})
				.then((refItem) => {
					const ref = refItem.sceneItemTransform as ObsSceneItemTransform;
					rtn.targets.doubles = {
						positionX: ref.positionX,
						positionY: ref.positionY,
						width: ref.width,
						height: ref.height,
					};
					return obs.call('GetSceneItemTransform', {
						sceneItemId: referenceSingles.sceneItemId!,
						sceneName: referenceSingles.sceneName,
					});
				})
				.then((refItem) => {
					const ref = refItem.sceneItemTransform as ObsSceneItemTransform;
					rtn.targets.singles = {
						positionX: ref.positionX,
						positionY: ref.positionY,
						width: ref.width,
						height: ref.height,
					};
					return obs.call('GetSceneItemTransform', {
						sceneItemId: source.sceneItemId!,
						sceneName: source.sceneName,
					});
				})
				.then((srcItem) => {
					const src = srcItem.sceneItemTransform as ObsSceneItemTransform;
					rtn.source = {
						sourceWidth: src.sourceWidth,
						sourceHeight: src.sourceHeight,
						cropTop: src.cropTop,
						cropBottom: src.cropBottom,
						cropLeft: src.cropLeft,
						cropRight: src.cropRight,
						scaleX: src.scaleX,
					};
					let currentReference = rtn.targets[playTypeRep.value];
					res(rtn);
				})
				.catch((err) => {
					rej(err);
				});
		} else {
			rej('Must be connected to update camera info');
		}
	});
}

function myError(err: any) {
	nodecg.log.error(new Error(err).stack);
	console.log(JSON.stringify(err));
}

function percentToPixels(
	transform: Partial<ObsSceneItemTransform>
): Partial<ObsSceneItemTransform> {
	const rtn: Partial<ObsSceneItemTransform> = {};
	for (const [key, value] of Object.entries(transform)) {
		if (key === 'scaleX' || key === 'scaleY') {
			rtn[key] = transform[key];
		} else if (typeof value === 'number') {
			rtn[key as keyof ObsSceneItemTransform] = value * screenWidth;
		} else rtn[key as keyof ObsSceneItemTransform] = value;
	}
	return rtn;
}
