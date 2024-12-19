"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playersRep = nodecg.Replicant('players');
const playTypeRep = nodecg.Replicant('playType');
const switchPlayerRep = nodecg.Replicant('switchPlayer');
const scoreRep = nodecg.Replicant('score');
const score1 = document.getElementById('score1');
const score2 = document.getElementById('score2');
const inc1 = document.getElementById('inc1');
const inc2 = document.getElementById('inc2');
const dec1 = document.getElementById('dec1');
const dec2 = document.getElementById('dec2');
const swapChar = '&#x1F504';
const smashColors = [
    '--smash-gray',
    '--smash-red',
    '--smash-blue',
    '--smash-green',
    '--smash-yellow',
];
function sColor(num) {
    return 'var(' + smashColors[num] + ')';
}
function drawSwitchPlayers(players, type, switchPlayers) {
    let switchPlayerDiv = document.getElementById('switch-players');
    let switchLabels = document.getElementById('switch-labels');
    if (switchLabels)
        switchPlayerDiv.removeChild(switchLabels);
    switchLabels = document.createElement('div');
    switchLabels.id = 'switch-labels';
    let inputNumber = 2;
    if (type == 'doubles')
        inputNumber = 4;
    for (let x = 0; x < inputNumber; x++) {
        let playerDiv = document.createElement('div');
        playerDiv.id = 'switch-player-' + switchPlayers[x];
        playerDiv.className = 'switch-player';
        playerDiv.innerHTML = players[switchPlayers[x]].name;
        playerDiv.style.backgroundColor = sColor(players[switchPlayers[x]].color);
        switchLabels.appendChild(playerDiv);
    }
    switchPlayerDiv.appendChild(switchLabels);
    let singlesSwap = document.getElementById('single-switch-swap');
    let doublesSwap = document.getElementById('double-switch-swap');
    if (type == 'singles') {
        singlesSwap.style.zIndex = '1';
        doublesSwap.style.zIndex = '-1';
    }
    else {
        singlesSwap.style.zIndex = '-1';
        doublesSwap.style.zIndex = '1';
    }
}
function drawInputArea(players, type) {
    let inputArea = document.getElementById('input-area');
    inputArea.innerHTML = '';
    let inputNumber = 2;
    if (type == 'doubles')
        inputNumber = 4;
    let playersDiv = document.createElement('div');
    playersDiv.id = 'players';
    for (let x = 0; x < inputNumber; x++) {
        let playerDiv = document.createElement('div');
        playerDiv.className = 'player-div';
        if (type == 'doubles' && (x == 1 || x == 2))
            playerDiv.classList.add('center-player');
        let playerInput = document.createElement('input');
        playerInput.id = 'player-' + x;
        playerInput.value = players[x].name;
        playerInput.className = 'player-input';
        playerInput.style.borderColor = sColor(players[x].color);
        playerInput.onkeyup = (ev) => {
            if (ev.key == 'Enter') {
                playerInput.blur();
            }
        };
        playerInput.onblur = () => {
            playersRep.value[x].name = playerInput.value;
            console.log('blur');
        };
        playerDiv.appendChild(playerInput);
        let colorDiv = document.createElement('div');
        colorDiv.className = 'color-select';
        for (let y = 1; y <= inputNumber; y++) {
            let colorSelector = document.createElement('input');
            colorSelector.id = 'color-' + x + '-' + y;
            colorSelector.type = 'checkbox';
            colorSelector.className = 'color-checkbox';
            colorSelector.style.backgroundColor = sColor(y);
            if (players[x].color == y)
                colorSelector.checked = true;
            colorSelector.onclick = () => {
                if (colorSelector.checked) {
                    playersRep.value[x].color = y;
                    if (inputNumber == 4) {
                        if (x % 2) {
                            playersRep.value[x - 1].color = y;
                        }
                        else
                            playersRep.value[x + 1].color = y;
                    }
                }
                else
                    playersRep.value[x].color = 0;
            };
            colorDiv.appendChild(colorSelector);
        }
        playerDiv.appendChild(colorDiv);
        playersDiv.appendChild(playerDiv);
        if (x < inputNumber - 1) {
            let swap = document.createElement('span');
            swap.innerHTML = swapChar;
            swap.className = 'player-swap';
            swap.onclick = () => {
                NodeCG.waitForReplicants(playersRep, playTypeRep, switchPlayerRep).then(() => {
                    let newArray = JSON.parse(JSON.stringify(playersRep.value));
                    newArray[x] = playersRep.value[x + 1];
                    newArray[x + 1] = playersRep.value[x];
                    playersRep.value = newArray;
                    drawSwitchPlayers(playersRep.value, playTypeRep.value, switchPlayerRep.value);
                });
            };
            playersDiv.appendChild(swap);
        }
    }
    inputArea.appendChild(playersDiv);
    let buttonDiv = document.createElement('div');
    buttonDiv.id = 'button-div';
    let typeToggle = document.createElement('button');
    let otherType = 'Singles';
    if (type == 'singles')
        otherType = 'Doubles';
    typeToggle.innerHTML = 'Switch to ' + otherType;
    typeToggle.onclick = () => {
        if (type == 'singles') {
            playTypeRep.value = 'doubles';
        }
        else
            playTypeRep.value = 'singles';
    };
    buttonDiv.appendChild(typeToggle);
    let resetPlayers = document.createElement('button');
    resetPlayers.innerHTML = 'Reset Players';
    resetPlayers.onclick = () => {
        playersRep.value = [
            { name: '', color: 0 },
            { name: '', color: 0 },
            { name: '', color: 0 },
            { name: '', color: 0 },
        ];
        switchPlayerRep.value = [0, 1, 2, 3];
        scoreRep.value = [0, 0];
    };
    resetPlayers.oncontextmenu = (e) => {
        e.preventDefault();
        playersRep.value = [
            { name: 'Player 1', color: 1 },
            { name: 'Player 2', color: 2 },
            { name: 'Player 3', color: 3 },
            { name: 'Player 4', color: 4 },
        ];
        switchPlayerRep.value = [0, 1, 2, 3];
        scoreRep.value = [0, 0];
    };
    buttonDiv.appendChild(resetPlayers);
    inputArea.appendChild(buttonDiv);
}
playTypeRep.on('change', (newVal) => {
    if (!newVal)
        return;
    NodeCG.waitForReplicants(playersRep, switchPlayerRep).then(() => {
        drawInputArea(playersRep.value, newVal);
        drawSwitchPlayers(playersRep.value, newVal, switchPlayerRep.value);
    });
});
playersRep.on('change', (newVal) => {
    if (!newVal)
        return;
    for (let x = 0; x < newVal.length; x++) {
        for (let y = 0; y < smashColors.length; y++) {
            let checkbox = document.getElementById('color-' + x + '-' + y);
            if (checkbox) {
                if (newVal[x].color == y) {
                    checkbox.checked = true;
                }
                else
                    checkbox.checked = false;
            }
            let playerInput = document.getElementById('player-' + x);
            if (playerInput) {
                playerInput.style.borderColor = sColor(newVal[x].color);
                playerInput.value = newVal[x].name;
            }
            let switchLabel = document.getElementById('switch-player-' + x);
            if (switchLabel) {
                switchLabel.style.backgroundColor = sColor(newVal[x].color);
                switchLabel.innerHTML = newVal[x].name;
            }
        }
    }
});
switchPlayerRep.on('change', (newVal) => {
    if (!newVal)
        return;
    NodeCG.waitForReplicants(playersRep, playTypeRep).then(() => {
        drawSwitchPlayers(playersRep.value, playTypeRep.value, newVal);
    });
});
scoreRep.on('change', (newVal) => {
    if (!newVal)
        return;
    score1.innerHTML = newVal[0].toString();
    score2.innerHTML = newVal[1].toString();
});
inc1.onclick = () => {
    NodeCG.waitForReplicants(scoreRep).then(() => {
        if (scoreRep.value)
            scoreRep.value[0]++;
    });
};
inc2.onclick = () => {
    NodeCG.waitForReplicants(scoreRep).then(() => {
        if (scoreRep.value)
            scoreRep.value[1]++;
    });
};
dec1.onclick = () => {
    NodeCG.waitForReplicants(scoreRep).then(() => {
        if (scoreRep.value && scoreRep.value[0] > 0)
            scoreRep.value[0]--;
    });
};
dec2.onclick = () => {
    NodeCG.waitForReplicants(scoreRep).then(() => {
        if (scoreRep.value && scoreRep.value[1] > 0)
            scoreRep.value[1]--;
    });
};
document.getElementById('switch-1-2').onclick = () => {
    NodeCG.waitForReplicants(switchPlayerRep).then(() => {
        let newArray = JSON.parse(JSON.stringify(switchPlayerRep.value));
        newArray[0] = switchPlayerRep.value[1];
        newArray[1] = switchPlayerRep.value[0];
        switchPlayerRep.value = newArray;
    });
};
document.getElementById('switch-2-3').onclick = () => {
    NodeCG.waitForReplicants(switchPlayerRep).then(() => {
        let newArray = JSON.parse(JSON.stringify(switchPlayerRep.value));
        newArray[1] = switchPlayerRep.value[2];
        newArray[2] = switchPlayerRep.value[1];
        switchPlayerRep.value = newArray;
    });
};
document.getElementById('switch-3-4').onclick = () => {
    NodeCG.waitForReplicants(switchPlayerRep).then(() => {
        let newArray = JSON.parse(JSON.stringify(switchPlayerRep.value));
        newArray[2] = switchPlayerRep.value[3];
        newArray[3] = switchPlayerRep.value[2];
        switchPlayerRep.value = newArray;
    });
};
document.getElementById('single-switch-swap').onclick = () => {
    NodeCG.waitForReplicants(switchPlayerRep).then(() => {
        let newArray = JSON.parse(JSON.stringify(switchPlayerRep.value));
        newArray[0] = switchPlayerRep.value[1];
        newArray[1] = switchPlayerRep.value[0];
        switchPlayerRep.value = newArray;
    });
};
