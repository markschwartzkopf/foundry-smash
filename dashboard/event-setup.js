"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventInfoRep = nodecg.Replicant('event-info');
const damageTracking = nodecg.Replicant('damage-tracking');
const playerDamageRep = nodecg.Replicant('player-damage-rep');
const twitchChannel = nodecg.Replicant('twitch-channel');
let url = document.getElementById('url');
let name = document.getElementById('name');
let channel = document.getElementById('channel');
let damage = document.getElementById('damage-tracking');
damage.oninput = () => {
    NodeCG.waitForReplicants(damageTracking).then(() => {
        if (damage.checked) {
            damageTracking.value = true;
        }
        else {
            damageTracking.value = false;
        }
    });
};
damageTracking.on('change', (newVal) => {
    if (newVal) {
        damage.checked = true;
    }
    else {
        damage.checked = false;
        NodeCG.waitForReplicants(playerDamageRep).then(() => {
            playerDamageRep.value = ['unknown', 'unknown'];
        });
    }
});
/* playerDamageRep.on('change', (newVal) => {
    console.log(JSON.stringify(newVal));
}); */
url.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        NodeCG.waitForReplicants(eventInfoRep).then(() => {
            eventInfoRep.value.url = url.value;
        });
    }
};
name.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        NodeCG.waitForReplicants(eventInfoRep).then(() => {
            eventInfoRep.value.name = name.value;
        });
    }
};
channel.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        NodeCG.waitForReplicants(twitchChannel).then(() => {
            twitchChannel.value = channel.value;
        });
    }
};
twitchChannel.on('change', (newVal) => {
    channel.value = newVal;
});
eventInfoRep.on('change', (newVal) => {
    url.value = newVal.url;
    name.value = newVal.name;
});
