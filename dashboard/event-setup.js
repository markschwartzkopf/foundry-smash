"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventInfoRep = nodecg.Replicant('event-info');
const eventRep = nodecg.Replicant('event');
const damageTracking = nodecg.Replicant('damage-tracking');
const playerDamageRep = nodecg.Replicant('player-damage-rep');
const twitchChannel = nodecg.Replicant('twitch-channel');
let url = document.getElementById('url');
let name = document.getElementById('name');
let event = document.getElementById('event');
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
event.onkeyup = (ev) => {
    if (ev.key == 'Enter') {
        NodeCG.waitForReplicants(eventRep).then(() => {
            eventRep.value = event.value;
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
    if (!newVal)
        return;
    channel.value = newVal;
});
eventInfoRep.on('change', (newVal) => {
    if (!newVal)
        return;
    url.value = newVal.url;
    name.value = newVal.name;
});
eventRep.on('change', (newVal) => {
    if (!newVal)
        return;
    event.value = newVal;
});
