"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const obs_websocket_js_1 = __importDefault(require("obs-websocket-js"));
const pngjs_1 = require("pngjs");
/* let APPROVED_PIXELS = 0;
let AVG_COLOR: [number, number, number] = [0, 0, 0]; */
const nodecg = require('./nodecg-api-context').get();
const obsStatusRep = nodecg.Replicant('obs-status', { defaultValue: { status: 'disconnected', preview: null, program: null } });
obsStatusRep.value = { status: 'disconnected', preview: null, program: null };
const switchAnimTriggerRep = nodecg.Replicant('switch-trigger');
const playTypeRep = nodecg.Replicant('playType');
const cameraRep = nodecg.Replicant('camera');
const switchPlayerRep = nodecg.Replicant('switchPlayer');
const playerDamageRep = nodecg.Replicant('player-damage-rep', { defaultValue: ['unknown', 'unknown'] });
playerDamageRep.value = ['unknown', 'unknown'];
const damageTracking = nodecg.Replicant('damage-tracking');
/* const debug = nodecg.Replicant<{
    app: number;
    avg: [number, number, number];
    d: number;
}>('debug', { defaultValue: { app: 0, avg: [0, 0, 0], d: -1 } }); */
function hasObsPassword(bundleConfig) {
    const bc = bundleConfig;
    return typeof bc && typeof bc.obsPassword === 'string';
}
const obsPassword = hasObsPassword(nodecg.bundleConfig) ? nodecg.bundleConfig.obsPassword : '';
const obs = new obs_websocket_js_1.default();
let inGame = false;
let obsAnimationQueue = { count: 0, inAnimation: 0, functionQueue: [] };
const cameraInfo = {
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
const switchInfo = {
    sourceName: 'Switch',
    sceneName: 'SwitchScene',
    sceneItemId: -1,
};
let allCameraItems = [];
allCameraItems.push(cameraInfo.game.cam1.source);
allCameraItems.push(cameraInfo.game.cam2.source);
allCameraItems.push(cameraInfo.preGame.cam1.source);
allCameraItems.push(cameraInfo.preGame.cam2.source);
let screenWidth = 1280;
let switchInCenter = {
    positionY: 0.2813,
};
let bumpStart = {
    positionY: 0.289,
};
let bumpEnd = {
    positionY: 0.2813,
};
let switchFullScreen = {
    scaleX: 2.456481456756592,
    scaleY: 2.456481456756592,
};
let switchPregameSingles = {
    positionX: 0.5,
    positionY: 0.4344,
    scaleX: 1,
    scaleY: 1,
};
let switchPregameDoubles = {
    positionX: 0.5,
    positionY: 0.1219,
    scaleX: 1,
    scaleY: 1,
};
let p1LastWarnings = [-1, -1];
let p2LastWarnings = [-1, -1];
const SMOKE_THRESHOLD = 100;
const FIRE_THRESHOLD = 124;
setInterval(() => {
    if (obsAnimationQueue.inAnimation == null &&
        obsStatusRep.value.status == 'connected' &&
        playTypeRep.value === 'singles' &&
        obsStatusRep.value.program === 'Game' &&
        inGame &&
        damageTracking.value) {
        obs
            .call('GetSourceScreenshot', {
            sourceName: 'GameCapture',
            imageFormat: 'png',
            imageWidth: 640,
            imageHeight: 360,
        })
            .then((data) => {
            const buf = Buffer.from(data.imageData.slice(22), 'base64'); //slice removes 'data:image/png;base64'
            /* fs.writeFile(__dirname + '_test.png', buf, () => {
                console.log(__dirname + '_test.png');
            }); */
            const png = pngjs_1.PNG.sync.read(buf);
            let p1Warning = getDamageFromTextColor(png, 176, 310, 213, 327);
            let p2Warning = getDamageFromTextColor(png, 423, 310, 460, 327);
            /* debug.value = {
                app: APPROVED_PIXELS,
                avg: AVG_COLOR,
                d: Math.round(p2Warning),
            }; */
            if (switchPlayerRep.value[0] === 1) {
                const temp = p1Warning;
                p1Warning = p2Warning;
                p2Warning = temp;
            }
            if (hasContinuity(3, [...p1LastWarnings, p1Warning])) {
                if (isUnknown([...p1LastWarnings, p1Warning])) {
                    playerDamageRep.value[0] = 'unknown';
                }
                else if (p1Warning > FIRE_THRESHOLD) {
                    playerDamageRep.value[0] = 'deathsDoor';
                }
                else if (p1Warning > SMOKE_THRESHOLD) {
                    playerDamageRep.value[0] = 'injured';
                }
                else
                    playerDamageRep.value[0] = 'healthy';
            }
            if (hasContinuity(3, [...p2LastWarnings, p2Warning])) {
                if (isUnknown([...p2LastWarnings, p2Warning])) {
                    playerDamageRep.value[1] = 'unknown';
                }
                else if (p2Warning > FIRE_THRESHOLD) {
                    playerDamageRep.value[1] = 'deathsDoor';
                }
                else if (p2Warning > SMOKE_THRESHOLD) {
                    playerDamageRep.value[1] = 'injured';
                }
                else
                    playerDamageRep.value[1] = 'healthy';
            }
            p1LastWarnings.shift();
            p1LastWarnings.push(p1Warning);
            p2LastWarnings.shift();
            p2LastWarnings.push(p2Warning);
        })
            .catch((err) => nodecg.log.error(err));
    }
    else {
        playerDamageRep.value[0] = 'unknown';
        playerDamageRep.value[1] = 'unknown';
    }
}, 1000);
function hasContinuity(threshold, elements) {
    let rtn = true;
    for (let i = 1; i < elements.length; i++) {
        if (Math.abs(elements[i - 1] - elements[i]) > threshold)
            rtn = false;
    }
    return rtn;
}
function isUnknown(elements) {
    let rtn = true;
    for (let i = 0; i < elements.length; i++) {
        if (elements[i] !== -1)
            rtn = false;
    }
    return rtn;
}
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
                        let func = obsAnimationQueue.functionQueue.shift();
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
                    nodecg.log.info('OBS connected. Program: "' +
                        sceneList.currentProgramSceneName +
                        '" Preview: "' +
                        sceneList.currentPreviewSceneName +
                        '"');
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
                    if (res.sceneName !== 'Game') {
                        inGame = false;
                        playerDamageRep.value = ['unknown', 'unknown'];
                    }
                });
                obs.on('CurrentPreviewSceneChanged', (res) => {
                    obsStatusRep.value.preview = res.sceneName;
                });
                obs.on('StudioModeStateChanged', (res) => {
                    if (res.studioModeEnabled) {
                        obs.call('GetCurrentPreviewScene').then((res) => {
                            obsStatusRep.value.preview = res.currentPreviewSceneName;
                        });
                    }
                    else
                        obsStatusRep.value.preview = null;
                });
            })
                .catch((err) => {
                if (err.code != 'CONNECTION_ERROR')
                    myError(err);
            });
        }
        else
            clearInterval(obsConnect);
    }, 5000);
}
obs.on('ConnectionClosed', () => {
    if (obsStatusRep.value.status == 'connected') {
        obsStatusRep.value.status = 'disconnected';
        nodecg.log.info('OBS disconnected');
    }
});
nodecg.listenFor('connect', () => {
    if (obsStatusRep.value.status == 'disconnected')
        connectObs();
});
nodecg.listenFor('disconnect', () => {
    obsStatusRep.value.status = 'disconnected';
    obs.disconnect();
});
nodecg.listenFor('getOBSprops', (itemName, ack) => {
    if (obsStatusRep.value.status == 'connected' && obsStatusRep.value.program) {
        obs
            .call('GetSceneItemList', { sceneName: obsStatusRep.value.program })
            .then((data) => {
            const sceneItem = data.sceneItems.filter((x) => {
                return x.sourceName === itemName;
            })[0];
            const itemId = sceneItem &&
                sceneItem.sceneItemId &&
                typeof sceneItem.sceneItemId === 'number'
                ? sceneItem.sceneItemId
                : 0;
            return obs.call('GetSceneItemTransform', {
                sceneName: obsStatusRep.value.program,
                sceneItemId: itemId,
            });
        })
            .then((ret) => {
            if (ack && !ack.handled)
                ack(null, ret);
        })
            .catch((err) => {
            if (ack && !ack.handled)
                ack(err);
        });
    }
    else
        myError('Cannot send commands to OBS unless connected');
});
nodecg.listenFor('toGame', () => {
    clearGame();
    if (obsStatusRep.value.program != 'Pregame') {
        obs
            .call('SetCurrentProgramScene', { sceneName: 'Game' })
            .catch((err) => {
            myError(err);
        });
        return;
    }
    getCurrentProps(switchInfo)
        .then((transform) => {
        move(switchInfo, Date.now(), 1000, createSeObject(transform, percentToPixels(switchInCenter)), () => {
            switchAnimTriggerRep.value = 'joyconsIn';
        });
    })
        .catch((err) => {
        myError(err);
    });
});
nodecg.listenFor('bumpSwitch', () => {
    if (obsStatusRep.value.status == 'connected') {
        move(switchInfo, Date.now(), 70, createSeObject(percentToPixels(bumpStart), percentToPixels(bumpEnd)));
    }
    else
        myError('Cannot send commands to OBS unless connected');
});
nodecg.listenFor('gameStart', () => {
    if (obsStatusRep.value.status == 'connected') {
        const growIn = {
            boundsWidth: {
                start: 1,
                end: cameraRep.value.game.cam1.targets[playTypeRep.value].width,
            },
            boundsHeight: {
                start: 1,
                end: cameraRep.value.game.cam1.targets[playTypeRep.value].height,
            },
        };
        const shrunk = {
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
            move(cameraInfo.game.cam1.source, Date.now(), duration, growIn, () => { }, 'overshoot');
            setTimeout(() => {
                move(cameraInfo.game.cam2.source, Date.now(), duration, growIn, () => { }, 'overshoot');
            }, duration + delay);
            setTimeout(() => {
                nodecg.sendMessage('gameOverlayIn');
                if (obsStatusRep.value.program === 'Game') {
                    inGame = true;
                    p1LastWarnings = [-1, -1];
                    p2LastWarnings = [-1, -1];
                    playerDamageRep.value =
                        damageTracking.value && playTypeRep.value === 'singles'
                            ? ['healthy', 'healthy']
                            : ['unknown', 'unknown'];
                }
            }, duration + delay + duration);
        })
            .catch((err) => {
            myError(JSON.stringify(err));
        });
    }
    else
        myError('Cannot send commands to OBS unless connected');
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
nodecg.listenFor('cameraChange', (change) => {
    console.log('cameraChange', change);
    let cam = cameraInfo[change.scene][change.item].source;
    let transform = change.camera;
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
        move(switchInfo, Date.now(), 500, createSeObject(props, percentToPixels(switchFullScreen)), () => {
            obs
                .call('SetCurrentProgramScene', { sceneName: 'Game' })
                .then(() => {
                setTimeout(() => {
                    nodecg.sendMessage('resetPregame');
                }, 500);
            })
                .catch((err) => {
                myError(err);
            });
        }, 'overshoot');
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
    return new Promise((res, rej) => {
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
        }
        else
            rej(new Error('OBS not connected').stack);
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
        const switchTransform = percentToPixels(playTypeRep.value === 'singles'
            ? switchPregameSingles
            : switchPregameDoubles);
        obsDo(() => {
            obs
                .call('SetSceneItemTransform', {
                sceneName: switchInfo.sceneName,
                sceneItemId: switchInfo.sceneItemId,
                sceneItemTransform: switchTransform,
            })
                .catch((err) => {
                myError(JSON.stringify(err));
            });
        });
    }
}
function refreshCameraLocations() {
    if (obsStatusRep.value.status === 'connected') {
        obsDo(async () => {
            function generateTransform(scene, cam) {
                return {
                    sceneName: cameraInfo[scene][cam].source.sceneName,
                    sceneItemId: cameraInfo[scene][cam].source.sceneItemId,
                    sceneItemTransform: {
                        positionX: cameraRep.value[scene][cam].targets[playTypeRep.value].positionX,
                        positionY: cameraRep.value[scene][cam].targets[playTypeRep.value].positionY,
                        boundsWidth: cameraRep.value[scene][cam].targets[playTypeRep.value].width,
                        boundsHeight: cameraRep.value[scene][cam].targets[playTypeRep.value].height,
                        ...refreshedAspectRatioCrop(cameraRep.value[scene][cam]),
                    },
                };
            }
            const transforms = [
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
function refreshedAspectRatioCrop(cam) {
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
    const targetRatio = cam.targets[playTypeRep.value].width /
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
    }
    else {
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
        }
        else {
            let newHeight = width / targetRatio;
            let cropAdd = height - newHeight;
            rtn.cropTop += Math.round(cropAdd / 2);
            rtn.cropBottom += Math.round(cropAdd / 2);
        }
    }
    return rtn;
}
function obsDo(func) {
    if (obsAnimationQueue.inAnimation == null &&
        obsStatusRep.value.status == 'connected') {
        func();
    }
    else {
        obsAnimationQueue.functionQueue.push(func);
    }
}
function move(item, start, duration, transform, callback, ease, thisAnimation) {
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
            }
            else {
                let s = Math.sin(9 * Math.PI * progress);
                let r = Math.cos(Math.PI * progress) / 2 + 0.5;
                let t = (s * r) / 8;
                if (progress <= 0.5) {
                    progress = 4 * progress ** 2 + t;
                }
                else
                    progress = 1 + t;
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
        }
        else {
            if (callback)
                callback();
            if (obsAnimationQueue.inAnimation == thisAnimation) {
                obsAnimationQueue.inAnimation = null;
                while (obsAnimationQueue.functionQueue.length > 0) {
                    let func = obsAnimationQueue.functionQueue.shift();
                    func();
                }
            }
        }
    })
        .catch((err) => {
        myError(JSON.stringify(err));
    });
}
function deriveProps(progress, transform) {
    let rtn = {};
    for (const [key, value] of Object.entries(transform)) {
        let start = value.start;
        let end = value.end;
        rtn[key] = start + (end - start) * progress;
    }
    return rtn;
}
function createSeObject(start, end) {
    let rtn = {};
    for (const [key, value] of Object.entries(end)) {
        if (start.hasOwnProperty(key)) {
            let startNum = start[key];
            if (typeof startNum == 'number') {
                rtn[key] = {
                    start: startNum,
                    end: value,
                };
            }
            else
                myError('Starting animProp incompatible with ending (num)');
        }
        else {
            myError('Starting transform is missing properties');
        }
    }
    return rtn;
}
function getCurrentProps(item) {
    return new Promise((res, rej) => {
        if (obsStatusRep.value.status == 'connected') {
            obs
                .call('GetSceneItemTransform', item)
                .then((rtn) => {
                res(rtn.sceneItemTransform);
            })
                .catch((err) => {
                rej(err);
            });
        }
        else {
            rej('Cannot send commands to OBS unless connected');
        }
    });
}
function populateIds() {
    return new Promise((res, rej) => {
        function checkSourceName(obsSource, item) {
            if (obsSource.sourceName === item.sourceName &&
                typeof item.sceneItemId === 'number')
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
            const itemId = sceneItem &&
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
    return new Promise((res, rej) => {
        getCameraInfo(cameraInfo.game.cam1.targets.doubles, cameraInfo.game.cam1.targets.singles, cameraInfo.game.cam1.source)
            .then((cam) => {
            cameraRep.value.game.cam1 = cam;
            return getCameraInfo(cameraInfo.game.cam2.targets.doubles, cameraInfo.game.cam2.targets.singles, cameraInfo.game.cam2.source);
        })
            .then((cam) => {
            cameraRep.value.game.cam2 = cam;
            return getCameraInfo(cameraInfo.preGame.cam1.targets.doubles, cameraInfo.preGame.cam1.targets.singles, cameraInfo.preGame.cam1.source);
        })
            .then((cam) => {
            cameraRep.value.preGame.cam1 = cam;
            return getCameraInfo(cameraInfo.preGame.cam2.targets.doubles, cameraInfo.preGame.cam2.targets.singles, cameraInfo.preGame.cam2.source);
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
function getCameraInfo(referenceDoubles, referenceSingles, source) {
    return new Promise((res, rej) => {
        let rtn = {
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
        if (obsStatusRep.value.status == 'connected' &&
            referenceDoubles.sceneItemId &&
            referenceSingles.sceneItemId &&
            source.sceneItemId) {
            obs
                .call('GetSceneItemTransform', {
                sceneItemId: referenceDoubles.sceneItemId,
                sceneName: referenceDoubles.sceneName,
            })
                .then((refItem) => {
                const ref = refItem.sceneItemTransform;
                rtn.targets.doubles = {
                    positionX: ref.positionX,
                    positionY: ref.positionY,
                    width: ref.width,
                    height: ref.height,
                };
                return obs.call('GetSceneItemTransform', {
                    sceneItemId: referenceSingles.sceneItemId,
                    sceneName: referenceSingles.sceneName,
                });
            })
                .then((refItem) => {
                const ref = refItem.sceneItemTransform;
                rtn.targets.singles = {
                    positionX: ref.positionX,
                    positionY: ref.positionY,
                    width: ref.width,
                    height: ref.height,
                };
                return obs.call('GetSceneItemTransform', {
                    sceneItemId: source.sceneItemId,
                    sceneName: source.sceneName,
                });
            })
                .then((srcItem) => {
                const src = srcItem.sceneItemTransform;
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
        }
        else {
            rej('Must be connected to update camera info');
        }
    });
}
function myError(err) {
    nodecg.log.error(new Error(err).stack);
    console.log(JSON.stringify(err));
}
function percentToPixels(transform) {
    const rtn = {};
    for (const [key, value] of Object.entries(transform)) {
        if (key === 'scaleX' || key === 'scaleY') {
            rtn[key] = transform[key];
        }
        else if (typeof value === 'number') {
            rtn[key] = value * screenWidth;
        }
        else
            rtn[key] = value;
    }
    return rtn;
}
function getDamageFromTextColor(png, x1, y1, x2, y2) {
    //loses accuracy above damage levels of 175% or so
    const DIFF_THRESHOLD = 5; //3? How different can neighbors be for pixel to still be considered
    const RED_THRESHOLD = 210; //How much red must a pixel have in order to be considered
    const DIMRED_THRESHOLD = 100; //At high damage levels, red starts to dim, and blue rises a bit
    const DIMGREEN_THRESHOLD = 4; //However, green remains very very low
    const PIXELS_USED_THRESHOLD = 5; //What percentage of pixels must be used in order to consider result valid
    let total = 0;
    let approved = 0;
    const avgColor = [0, 0, 0];
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
            total++;
            const pixel = getPixel(png, x, y);
            if (pixel[0] > RED_THRESHOLD ||
                (pixel[0] > DIMRED_THRESHOLD && pixel[1] < DIMGREEN_THRESHOLD)) {
                if (isLikeNeighbors(png, x, y) < DIFF_THRESHOLD) {
                    approved++;
                    avgColor[0] += pixel[0];
                    avgColor[1] += pixel[1];
                    avgColor[2] += pixel[2];
                }
            }
        }
    }
    /* console.log(Math.round(100 * (approved / total)) + '%');
    console.log(
        `Average color: ${avgColor[0] / approved},${avgColor[1] / approved},${
            avgColor[2] / approved
        }`
    ); */
    /* APPROVED_PIXELS = Math.round(100 * (approved / total));
    AVG_COLOR = [
        Math.round(avgColor[0] / (25.5 * approved)),
        Math.round(avgColor[1] / (25.5 * approved)),
        Math.round(avgColor[2] / (25.5 * approved)),
    ]; */
    //AVG_COLOR = avgColor;
    if (approved > 0 && 100 * (approved / total) > PIXELS_USED_THRESHOLD) {
        avgColor[0] /= approved;
        avgColor[1] /= approved;
        avgColor[2] /= approved;
        let rtn = (avgColor[0] - avgColor[1]) * 0.45 + 12;
        if (avgColor[1] < DIMGREEN_THRESHOLD) {
            rtn = (255 + (255 - avgColor[0]) + avgColor[2]) * 0.45 - 12;
        }
        return rtn;
    }
    else
        return -1;
}
function getPixel(png, x, y) {
    const pixelOffset = (x + y * png.width) * 4;
    return [
        png.data.readUInt8(pixelOffset),
        png.data.readUInt8(pixelOffset + 1),
        png.data.readUInt8(pixelOffset + 2),
    ];
}
function isLikeNeighbors(png, x, y) {
    let idx = (x + y * png.width) * 4;
    let diff = Math.abs((png.data.readUInt8(idx - 4) +
        png.data.readUInt8(idx + 4) +
        png.data.readUInt8(idx - png.width * 4) +
        png.data.readUInt8(idx + png.width * 4)) /
        4 -
        png.data.readUInt8(idx));
    idx++;
    diff += Math.abs((png.data.readUInt8(idx - 4) +
        png.data.readUInt8(idx + 4) +
        png.data.readUInt8(idx - png.width * 4) +
        png.data.readUInt8(idx + png.width * 4)) /
        4 -
        png.data.readUInt8(idx));
    idx++;
    diff += Math.abs((png.data.readUInt8(idx - 4) +
        png.data.readUInt8(idx + 4) +
        png.data.readUInt8(idx - png.width * 4) +
        png.data.readUInt8(idx + png.width * 4)) /
        4 -
        png.data.readUInt8(idx));
    return diff;
}
