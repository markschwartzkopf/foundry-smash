/// <reference path="../../../../types/browser.d.ts" />
export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

const playTypeRep = nodecg.Replicant<playType>('playType');
const eventInfoRep = nodecg.Replicant<EventInfo>('event-info');
const logosRep = nodecg.Replicant<Asset[]>('assets:event-logos');
const eventRep = nodecg.Replicant<string>('event');
let playTypeDiv = document.getElementById('category') as HTMLDivElement;
let eventName = document.getElementById('header-main-text') as HTMLDivElement;
let eventUrl = document.getElementById('footer') as HTMLDivElement;
let logo = document.getElementById('corner-svg') as HTMLImageElement;

/* playTypeRep.on('change', (newValue) => {
	if (newValue == 'singles') playTypeDiv.innerHTML = 'Singles';
	if (newValue == 'doubles') playTypeDiv.innerHTML = 'Doubles';
}); */

eventInfoRep.on('change', (newVal) => {
	eventUrl.innerHTML = newVal.url;
	eventName.innerHTML = newVal.name;
});

eventRep.on('change', (newVal) => {
	playTypeDiv.innerHTML = newVal;
})

logosRep.on('change', (newVal) => {
	if (newVal.length > 0) {
		logo.src = newVal[0].url;
	} else logo.src = 'foundry-logo.svg'
});
