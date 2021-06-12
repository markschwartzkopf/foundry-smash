"use strict";
/// <reference path="../../../../types/browser.d.ts" />
document.body.style.backgroundColor = 'red';
const obsStatusRep2 = nodecg.Replicant('obs-status');
let itemName = document.getElementById('item-name');
let getProps = document.getElementById('get-props');
let props = document.getElementById('props');
getProps.onclick = () => {
    nodecg.sendMessage('getOBSprops', itemName.value).then((rtn) => {
        props.innerHTML = '<pre>' + JSON.stringify(rtn, null, 2) + '</pre>';
        props.style.backgroundColor = '';
    }).catch((err) => {
        props.innerHTML = '<pre>' + JSON.stringify(err, null, 2) + '</pre>';
        props.style.backgroundColor = 'yellow';
    });
};
obsStatusRep2.on('change', (newVal) => {
    if (newVal.status == 'connected') {
        document.body.style.backgroundColor = '';
    }
    else {
        document.body.style.backgroundColor = 'red';
    }
});
