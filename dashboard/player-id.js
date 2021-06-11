"use strict";
/// <reference path="../../../../types/browser.d.ts" />
const playersRep = nodecg.Replicant('players');
const playTypeRep = nodecg.Replicant('playType');
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
                }
                else
                    playersRep.value[x].color = 0;
            };
            colorDiv.appendChild(colorSelector);
        }
        playerDiv.appendChild(colorDiv);
        playersDiv.appendChild(playerDiv);
    }
    inputArea.appendChild(playersDiv);
    let typeToggle = document.createElement('button');
    typeToggle.className = 'type-toggle';
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
    inputArea.appendChild(typeToggle);
}
playTypeRep.on('change', (newVal) => {
    NodeCG.waitForReplicants(playersRep).then(() => {
        drawInputArea(playersRep.value, newVal);
    });
});
playersRep.on('change', (newVal) => {
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
        }
    }
});
