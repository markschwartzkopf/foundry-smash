/// <reference path="../../../../types/browser.d.ts" />
export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

const eventInfoRep = nodecg.Replicant<EventInfo>('event-info');

let url = document.getElementById('url')! as HTMLInputElement;
let name = document.getElementById('name')! as HTMLInputElement;

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

eventInfoRep.on('change', (newVal) => {
	url.value = newVal.url;
	name.value = newVal.name;
});
