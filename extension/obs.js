"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodecg = require('./nodecg-api-context').get();
const obsStatusRep = nodecg.Replicant('obs-status');
const switchAnimTriggerRep = nodecg.Replicant('switch-trigger');
obsStatusRep.value = { status: 'disconnected' };
const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();
connectObs();
obs.on('error', (err) => {
    nodecg.log.error('OBS websocket error:' + JSON.stringify(err));
});
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
                nodecg.log.info('OBS connected');
            })
                .catch((err) => { });
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
    if (obsStatusRep.value.status == 'connected') {
        obs
            .send('GetSceneItemProperties', { item: itemName })
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
        nodecg.log.error('Cannot send commands to OBS unless connected');
});
nodecg.listenFor('toGame', () => {
    //add here: reset props that could need it
    getCurrentProps('Switch')
        .then((props) => {
        move('Switch', Date.now(), 1000, createSeObject(extractAnimProp(props), switchInCenter), () => {
            switchAnimTriggerRep.value = 'joyconsIn';
        });
    })
        .catch((err) => {
        nodecg.log.error(err);
    });
});
nodecg.listenFor('bumpSwitch', () => {
    if (obsStatusRep.value.status == 'connected') {
        move('Switch', Date.now(), 70, bump);
    }
    else
        nodecg.log.error('Cannot send commands to OBS unless connected');
});
nodecg.listenFor('zoomToFullscreen', () => {
    getCurrentProps('Switch')
        .then((props) => {
        move('Switch', Date.now(), 500, createSeObject(extractAnimProp(props), switchFullScreen), () => {
            //add code: switch to game scene
        }, 'overshoot');
    })
        .catch((err) => {
        nodecg.log.error(err);
    });
});
nodecg.listenFor('resetToPregame', () => {
    let props = switchPregame;
    props.item = 'Switch';
    obs.send('SetSceneItemProperties', props).catch((err) => {
        nodecg.log.error(JSON.stringify(err));
    });
});
function move(itemName, start, duration, transform, callback, ease) {
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
    props.item = itemName;
    obs
        .send('SetSceneItemProperties', props)
        .then(() => {
        if (!done) {
            move(itemName, start, duration, transform, callback, ease);
        }
        else {
            if (callback)
                callback();
        }
    })
        .catch((err) => {
        nodecg.log.error(JSON.stringify(err));
    });
}
function deriveProps(progress, transform) {
    // This will break if any OBS properties have both a "start" and "end" property
    // Also possibly broken by empty objects, which typing currently allows
    let rtn = {};
    for (const [key, value] of Object.entries(transform)) {
        if (value.hasOwnProperty('start') && value.hasOwnProperty('end')) {
            let start = value.start;
            let end = value.end;
            rtn[key] = start + (end - start) * progress;
        }
        else {
            let seObj = value;
            rtn[key] = deriveProps(progress, seObj);
        }
    }
    return rtn;
}
function createSeObject(start, end) {
    let rtn = {};
    for (const [key, value] of Object.entries(end)) {
        if (start.hasOwnProperty(key)) {
            switch (typeof value) {
                case 'number':
                    let startNum = start[key];
                    if (typeof startNum == 'number') {
                        rtn[key] = { start: startNum, end: value };
                    }
                    else
                        nodecg.log.error('Starting animProp incompatible with ending (num)');
                    break;
                case 'object':
                    let startObj = start[key];
                    if (typeof startObj == 'object') {
                        rtn[key] = createSeObject(startObj, value);
                    }
                    else
                        nodecg.log.error('Starting animProp incompatible with ending (obj)');
                    break;
            }
        }
        else {
            nodecg.log.error('Starting animProp is missing properties');
        }
    }
    return rtn;
}
function extractAnimProp(input) {
    let rtn = {};
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
function getCurrentProps(itemName) {
    return new Promise((res, rej) => {
        if (obsStatusRep.value.status == 'connected') {
            obs
                .send('GetSceneItemProperties', { item: itemName })
                .then((rtn) => {
                if (typeof rtn == 'object') {
                    res(rtn);
                }
                else {
                    rej('OBS did not return an object:' + rtn);
                }
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
let switchInCenter = {
    position: {
        y: 540,
    },
};
let slideUp = {
    position: {
        y: { start: 834, end: 540 },
    },
};
let bump = {
    position: {
        y: { start: 547, end: 540 },
    },
};
let zoomToFullscreen = {
    scale: {
        x: { start: 1, end: 2.456481456756592 },
        y: { start: 1, end: 2.456481456756592 },
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