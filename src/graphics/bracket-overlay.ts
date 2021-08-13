/// <reference path="../../../../types/browser.d.ts" />
export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

const playTypeRep = nodecg.Replicant<playType>('playType');
let playTypeDiv = document.getElementById('category') as HTMLDivElement;

playTypeRep.on('change', (newValue) => {
	if (newValue == 'singles') playTypeDiv.innerHTML = 'Singles';
  if (newValue == 'doubles') playTypeDiv.innerHTML = 'Doubles';
});
