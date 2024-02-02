"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playersRep = nodecg.Replicant('players');
const playTypeRep = nodecg.Replicant('playType');
const mirrorRep = nodecg.Replicant('mirror');
const switchPlayerRep = nodecg.Replicant('switchPlayer');
const scoreRep = nodecg.Replicant('score');
const playerDamageRep = nodecg.Replicant('player-damage-rep');
/* const debug = nodecg.Replicant<{ app: number; avg: [number, number, number] }>(
    'debug',
    { defaultValue: { app: 0, avg: [0, 0, 0] } }
); */
//const debugDiv = document.getElementById('debug') as HTMLDivElement;
//const debug2Div = document.getElementById('debug2') as HTMLDivElement;
/* debug.on('change', (newVal) => {
    debugDiv.innerHTML = JSON.stringify(newVal, null, 2);
    console.log(newVal);
}); */
playerDamageRep.on('change', (newVal, oldVal) => {
    //debug2Div.innerHTML = newVal[1];
    if (!oldVal || newVal[0] !== oldVal[0]) {
        switch (newVal[0]) {
            case 'healthy':
                smokeOut('1');
                fireOut('1');
                break;
            case 'injured':
                smokeIn('1');
                fireOut('1');
                break;
            case 'deathsDoor':
                smokeOut('1');
                fireIn('1');
                break;
            case 'unknown':
                smokeOut('1');
                fireOut('1');
                break;
        }
    }
    if (!oldVal || newVal[1] !== oldVal[1]) {
        switch (newVal[1]) {
            case 'healthy':
                smokeOut('2');
                fireOut('2');
                break;
            case 'injured':
                smokeIn('2');
                fireOut('2');
                break;
            case 'deathsDoor':
                smokeOut('2');
                fireIn('2');
                break;
            case 'unknown':
                smokeOut('2');
                fireOut('2');
                break;
        }
    }
});
let oldSwitchArray = [
    { name: '', color: 0 },
    { name: '', color: 0 },
    { name: '', color: 0 },
    { name: '', color: 0 },
];
const smashColors = [
    '--smash-gray',
    '--smash-red',
    '--smash-blue',
    '--smash-green',
    '--smash-yellow',
];
const root = document.documentElement;
let bannersDiv = document.getElementById('banner-shadow-hide');
let namesDiv = document.getElementById('name-hide');
let score1 = document.getElementById('score1');
let score2 = document.getElementById('score2');
let player1 = document.getElementById('player-name1');
let player2 = document.getElementById('player-name2');
let player3 = document.getElementById('player-name3');
let player4 = document.getElementById('player-name4');
function sColor(num) {
    return 'var(' + smashColors[num] + ')';
}
scoreRep.on('change', (newVal) => {
    score1.innerHTML = newVal[0].toString();
    score2.innerHTML = newVal[1].toString();
});
mirrorRep.on('change', (newVal, oldVal) => {
    NodeCG.waitForReplicants(playersRep, switchPlayerRep, playTypeRep, mirrorRep).then(() => {
        setNamesAndColors(playersRep.value, switchPlayerRep.value, playTypeRep.value, newVal);
    });
});
playersRep.on('change', (newVal, oldVal) => {
    NodeCG.waitForReplicants(switchPlayerRep, playTypeRep, mirrorRep).then(() => {
        setNamesAndColors(newVal, switchPlayerRep.value, playTypeRep.value, mirrorRep.value);
    });
});
switchPlayerRep.on('change', (newVal, oldVal) => {
    NodeCG.waitForReplicants(playersRep).then(() => {
        setNamesAndColors(playersRep.value, newVal, playTypeRep.value, mirrorRep.value);
    });
});
function setNamesAndColors(players, switchPlayers, type, mirror) {
    let name1 = document.getElementById('name1');
    let name2 = document.getElementById('name2');
    if (name1 && name2) {
        name1.style.transform = '';
        name2.style.transform = '';
        root.style.setProperty('--banner1', sColor(players[0].color));
        if (type == 'singles') {
            root.style.setProperty('--banner2', sColor(players[1].color));
            name1.innerHTML = players[0].name;
            name2.innerHTML = players[1].name;
        }
        else {
            root.style.setProperty('--banner2', sColor(players[2].color));
            if (mirror.cam1) {
                name1.innerHTML = players[0].name + ' & ' + players[1].name;
            }
            else
                name1.innerHTML = players[1].name + ' & ' + players[0].name;
            if (mirror.cam2) {
                name2.innerHTML = players[2].name + ' & ' + players[3].name;
            }
            else
                name2.innerHTML = players[3].name + ' & ' + players[2].name;
        }
        let width1 = name1.clientWidth;
        let right1 = name1.getBoundingClientRect().right;
        let width2 = name2.clientWidth;
        let left2 = name2.getBoundingClientRect().left;
        if (width1 > 280) {
            let scaleFactor1 = Math.round((280 * 100) / width1) / 100;
            name1.style.transform = 'scaleX(' + scaleFactor1 + ')';
            name1.style.transform =
                'scaleX(' +
                    scaleFactor1 +
                    ') translateX(' +
                    (right1 - name1.getBoundingClientRect().right) * (1 / scaleFactor1) +
                    'px)';
        }
        if (width2 > 280) {
            let scaleFactor2 = Math.round((280 * 100) / width2) / 100;
            name2.style.transform = 'scaleX(' + scaleFactor2 + ')';
            name2.style.transform =
                'scaleX(' +
                    scaleFactor2 +
                    ') translateX(' +
                    (left2 - name2.getBoundingClientRect().left) * (1 / scaleFactor2) +
                    'px)';
        }
    }
    let switchArray = JSON.parse(JSON.stringify(players));
    for (let x = 0; x < switchArray.length; x++) {
        switchArray[x] = players[switchPlayers[x]];
    }
    if (player1 && player2 && player3 && player4) {
        player1.innerHTML = switchArray[0].name;
        player2.innerHTML = switchArray[1].name;
        player3.innerHTML = switchArray[2].name;
        player4.innerHTML = switchArray[3].name;
        if ((!oldSwitchArray || !oldSwitchArray[0].name) && switchArray[0].name)
            player1.style.animation = 'fade-in 1000ms forwards';
        if ((!oldSwitchArray || !oldSwitchArray[1].name) && switchArray[1].name)
            player2.style.animation = 'fade-in 1000ms forwards';
        if ((!oldSwitchArray || !oldSwitchArray[2].name) && switchArray[2].name)
            player3.style.animation = 'fade-in 1000ms forwards';
        if ((!oldSwitchArray || !oldSwitchArray[3].name) && switchArray[3].name)
            player4.style.animation = 'fade-in 1000ms forwards';
        if (oldSwitchArray && oldSwitchArray[0].name && !switchArray[0].name)
            player1.style.animation = 'fade-out 1000ms forwards';
        if (oldSwitchArray && oldSwitchArray[1].name && !switchArray[1].name)
            player2.style.animation = 'fade-out 1000ms forwards';
        if (oldSwitchArray && oldSwitchArray[2].name && !switchArray[2].name)
            player3.style.animation = 'fade-out 1000ms forwards';
        if (oldSwitchArray && oldSwitchArray[3].name && !switchArray[3].name)
            player4.style.animation = 'fade-out 1000ms forwards';
        oldSwitchArray = switchArray;
    }
}
playTypeRep.on('change', (newVal) => {
    if (newVal == 'singles') {
        let elements = Array.from(document.getElementsByClassName('doubles'));
        elements.forEach((x) => {
            x.classList.replace('doubles', 'singles');
        });
    }
    else {
        let elements = Array.from(document.getElementsByClassName('singles'));
        elements.forEach((x) => {
            x.classList.replace('singles', 'doubles');
        });
    }
    NodeCG.waitForReplicants(playersRep, mirrorRep, switchPlayerRep).then(() => {
        setNamesAndColors(playersRep.value, switchPlayerRep.value, newVal, mirrorRep.value);
    });
});
nodecg.listenFor('zeroGame', () => {
    zeroGame();
});
nodecg.listenFor('gameOverlayIn', () => {
    zeroGame();
    bannersDiv.style.animation = 'banner-in 500ms forwards';
    namesDiv.style.animation = 'name-in 500ms 500ms forwards';
    score1.style.animation =
        'score-in 200ms cubic-bezier(0.76, 0.18, 0.96, 1.39) 1000ms forwards';
    score2.style.animation =
        'score-in 200ms cubic-bezier(0.76, 0.18, 0.96, 1.39) 1000ms forwards';
    player1.style.animation = 'fade-in 1000ms 1000ms forwards';
    player2.style.animation = 'fade-in 1000ms 1000ms forwards';
    player3.style.animation = 'fade-in 1000ms 1000ms forwards';
    player4.style.animation = 'fade-in 1000ms 1000ms forwards';
});
function zeroGame() {
    [
        player1,
        player2,
        player3,
        player4,
        bannersDiv,
        namesDiv,
        score1,
        score2,
    ].forEach((element) => {
        element.style.animation = 'unset';
    });
}
const smoke1 = document.createElement('video');
smoke1.autoplay = true;
smoke1.loop = true;
smoke1.muted = true;
smoke1.playsInline = true;
smoke1.id = 'smoke-1';
const src1 = document.createElement('source');
src1.src = 'smoke.webm';
src1.type = 'video/webm';
smoke1.appendChild(src1);
smoke1.style.filter = 'url(#filter)';
smoke1.style.opacity = '0';
smoke1.style.animation = 'fade-in 5000ms forwards';
const smoke2 = document.createElement('video');
smoke2.autoplay = true;
smoke2.loop = true;
smoke2.muted = true;
smoke2.playsInline = true;
smoke2.id = 'smoke-2';
const src2 = document.createElement('source');
src2.src = 'smoke.webm';
src2.type = 'video/webm';
smoke2.appendChild(src2);
smoke2.style.filter = 'url(#filter)';
smoke2.style.opacity = '0';
smoke2.style.animation = 'fade-in 5000ms forwards';
const fire1 = document.createElement('video');
fire1.autoplay = true;
fire1.loop = true;
fire1.muted = true;
fire1.playsInline = true;
fire1.id = 'fire-1';
const src3 = document.createElement('source');
src3.src = 'fire.webm';
src3.type = 'video/webm';
fire1.appendChild(src3);
fire1.style.opacity = '0';
fire1.style.animation = 'fade-in 5000ms forwards';
const fire2 = document.createElement('video');
fire2.autoplay = true;
fire2.loop = true;
fire2.muted = true;
fire2.playsInline = true;
fire2.id = 'fire-2';
const src4 = document.createElement('source');
src4.src = 'fire.webm';
src4.type = 'video/webm';
fire2.appendChild(src4);
fire2.style.opacity = '0';
fire2.style.animation = 'fade-in 5000ms forwards';
function smokeIn(num) {
    const smoke = document.getElementById('smoke-' + num);
    let play = false;
    if (smoke) {
        smoke.remove();
    }
    else
        play = true;
    const newSmoke = num === '1' ? smoke1 : smoke2;
    newSmoke.style.animation = 'fade-in 5000ms forwards';
    document.getElementById(`cam${num}-reference`).appendChild(newSmoke);
    if (play)
        newSmoke.play();
}
function smokeOut(num) {
    const FADE_TIME = 5000;
    const smoke = document.getElementById('smoke-' + num);
    if (smoke) {
        smoke.style.animation = `fade-out ${FADE_TIME}ms 0ms forwards`;
        setTimeout(() => {
            if (getComputedStyle(smoke).opacity === '0') {
                smoke.remove();
            }
            else
                console.log('Interrupted smokeOut()');
        }, FADE_TIME + 1000);
    }
}
function fireIn(num) {
    const fire = document.getElementById('fire-' + num);
    let play = false;
    if (fire) {
        fire.remove();
    }
    else
        play = true;
    const newfire = num === '1' ? fire1 : fire2;
    newfire.style.animation = 'fade-in 5000ms forwards';
    document.getElementById(`cam${num}-reference`).appendChild(newfire);
    if (play)
        newfire.play();
}
function fireOut(num) {
    const FADE_TIME = 5000;
    const fire = document.getElementById('fire-' + num);
    if (fire) {
        fire.style.animation = `fade-out ${FADE_TIME}ms 0ms forwards`;
        setTimeout(() => {
            if (getComputedStyle(fire).opacity === '0') {
                fire.remove();
            }
            else
                console.log('Interrupted fireOut()');
        }, FADE_TIME + 1000);
    }
}
