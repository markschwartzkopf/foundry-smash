import { obsStatus } from "../shared-types/shared";

export {}; //This is a hack to make TypeScript work. It is paired with "<script>var exports = {};</script>" in the HTML

document.body.style.backgroundColor = 'red';
const obsStatusRep2 = nodecg.Replicant<obsStatus>('obs-status');
let itemName = document.getElementById('item-name')! as HTMLInputElement;
let getProps = document.getElementById('get-props')! as HTMLButtonElement;
let props = document.getElementById('props')! as HTMLDivElement;

getProps.onclick = () => {
	nodecg.sendMessage('getOBSprops', itemName.value).then((rtn:any) => {
    props.innerHTML = '<pre>' + JSON.stringify(rtn, null, 2) + '</pre>';
    props.style.backgroundColor = '';
  }).catch((err) => {
    props.innerHTML = '<pre>' + JSON.stringify(err, null, 2) + '</pre>';
    props.style.backgroundColor = 'yellow';
  });
};
obsStatusRep2.on('change', (newVal) => {
  if (!newVal) return;
  if (newVal.status == 'connected') {
    document.body.style.backgroundColor = '';
  } else {
    document.body.style.backgroundColor = 'red';
  }
})