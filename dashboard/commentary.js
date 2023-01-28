"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const x32replicant = nodecg.Replicant('x32');
const twitchChannel = nodecg.Replicant('twitch-channel');
const comm1On = document.getElementById('comm1-on');
const comm2On = document.getElementById('comm2-on');
/* const comm1Level = document.getElementById('comm1-level') as HTMLInputElement;
const comm2Level = document.getElementById('comm2-level') as HTMLInputElement; */
const chatIframe = document.getElementById('twitch-chat-embed');
x32replicant.on('change', (newValue, oldValue) => {
    comm1On.checked = newValue.commentary[0].on;
    comm2On.checked = newValue.commentary[1].on;
    /* comm1Level.value = Math.round(newValue.commentary[0].level * 100).toString();
    comm2Level.value = Math.round(newValue.commentary[1].level * 100).toString(); */
});
comm1On.onchange = () => {
    NodeCG.waitForReplicants(x32replicant).then(() => {
        let newRep = JSON.parse(JSON.stringify(x32replicant.value));
        newRep.commentary[0].on = comm1On.checked;
        nodecg.sendMessage('x32adjust', newRep);
    });
};
comm2On.onchange = () => {
    NodeCG.waitForReplicants(x32replicant).then(() => {
        let newRep = JSON.parse(JSON.stringify(x32replicant.value));
        newRep.commentary[1].on = comm2On.checked;
        nodecg.sendMessage('x32adjust', newRep);
    });
};
/* comm1Level.oninput = () => {
    NodeCG.waitForReplicants(x32replicant).then(() => {
        let newValue = parseInt(comm1Level.value) / 100;
        let newRep = JSON.parse(JSON.stringify(x32replicant.value)) as x32settings;
        newRep.commentary[0].level = newValue;
        nodecg.sendMessage('x32adjust', newRep);
    });
};

comm2Level.oninput = () => {
    NodeCG.waitForReplicants(x32replicant).then(() => {
        let newValue = parseInt(comm2Level.value) / 100;
        let newRep = JSON.parse(JSON.stringify(x32replicant.value)) as x32settings;
        newRep.commentary[1].level = newValue;
        nodecg.sendMessage('x32adjust', newRep);
    });
};

comm1Level.onchange = () => {
    comm1Level.blur();
};

comm2Level.onchange = () => {
    comm2Level.blur();
}; */
twitchChannel.on('change', (newVal) => {
    chatIframe.src = `https://nightdev.com/hosted/obschat?theme=undefined&channel=${newVal}&fade=300&bot_activity=false&prevent_clipping=false`;
});
