/// <reference path="../../../../types/browser.d.ts" />
export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

const eventInfoRep = nodecg.Replicant<EventInfo>('event-info');
const damageTracking = nodecg.Replicant<boolean>('damage-tracking');
const playerDamageRep = nodecg.Replicant<playerDamageRep>('player-damage-rep');
const twitchChannel = nodecg.Replicant<string>('twitch-channel');

let url = document.getElementById('url')! as HTMLInputElement;
let name = document.getElementById('name')! as HTMLInputElement;
let channel = document.getElementById('channel')! as HTMLInputElement;
let damage = document.getElementById('damage-tracking')! as HTMLInputElement;

damage.oninput = () => {
	NodeCG.waitForReplicants(damageTracking).then(() => {
		if (damage.checked) {
			damageTracking.value = true;
		} else {
			damageTracking.value = false;
		}
	});
};

damageTracking.on('change', (newVal) => {
	if (newVal) {
		damage.checked = true;
	} else {
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
			eventInfoRep.value!.url = url.value;
		});
	}
};
name.onkeyup = (ev) => {
	if (ev.key == 'Enter') {
		NodeCG.waitForReplicants(eventInfoRep).then(() => {
			eventInfoRep.value!.name = name.value;
		});
	}
};
channel.onkeyup = (ev) => {
	if (ev.key == 'Enter') {
		NodeCG.waitForReplicants(twitchChannel).then(() => {
			twitchChannel.value! = channel.value;
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
