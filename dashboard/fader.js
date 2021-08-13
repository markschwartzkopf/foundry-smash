"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createFader(id) {
    let fader = document.createElement('div');
    fader.className = 'fader';
    fader.id = id;
    let track = document.createElement('div');
    let thumb = document.createElement('div');
    track.className = 'fader-track';
    track.id = id + '-track';
    track.onclick = (e) => {
        let trackRect = track.getBoundingClientRect();
        let pos = (trackRect.bottom - e.clientY) / (trackRect.bottom - trackRect.top);
        let size = parseFloat(fader.style.getPropertyValue('--size'));
        if (!size)
            size = 0;
        if (pos > 1 - size / 2)
            pos = 1 - size / 2;
        if (pos < size / 2)
            pos = size / 2;
        fader.style.setProperty('--position', pos.toString());
        fader.dispatchEvent(new CustomEvent('change', { detail: { position: pos, size: size } }));
        fader.dispatchEvent(new CustomEvent('changeComplete', {
            detail: { position: pos, size: size },
        }));
    };
    fader.appendChild(track);
    thumb.className = 'fader-thumb';
    thumb.id = id + '-thumb';
    thumb.onmousedown = (e) => {
        let initY = e.clientY;
        let initPos = parseFloat(fader.style.getPropertyValue('--position'));
        if (!initPos)
            initPos = 0;
        let initSize = parseFloat(fader.style.getPropertyValue('--size'));
        if (!initSize)
            initSize = 0;
        let maxPos = 1 - initSize / 2;
        let minPos = initSize / 2;
        e.preventDefault();
        document.onmouseup = (e) => {
            let pos = parseFloat(fader.style.getPropertyValue('--position'));
            if (!pos)
                pos = 0;
            let size = parseFloat(fader.style.getPropertyValue('--size'));
            if (!size)
                size = 0;
            fader.dispatchEvent(new CustomEvent('changeComplete', {
                detail: { position: pos, size: size },
            }));
            document.onmouseup = null;
            document.onmousemove = null;
        };
        document.onmousemove = (e) => {
            let possiblePos = initPos + (initY - e.clientY) / track.offsetHeight;
            let overDrag = Math.abs(possiblePos - 0.5) - (0.5 - initSize / 2); //how far past the end of the track;
            if (overDrag > 0) {
                overDrag -= 0.075;
                if (overDrag < 0)
                    overDrag = 0;
                let size = initSize - overDrag;
                if (size < 0)
                    size = 0;
                if (possiblePos > 0.5) {
                    possiblePos = 1 - size / 2;
                }
                else {
                    possiblePos = size / 2;
                }
                fader.style.setProperty('--position', possiblePos.toString());
                fader.style.setProperty('--size', size.toString());
                fader.dispatchEvent(new CustomEvent('change', {
                    detail: { position: possiblePos, size: size },
                }));
            }
            else {
                fader.style.setProperty('--position', possiblePos.toString());
                fader.style.setProperty('--size', initSize.toString());
                fader.dispatchEvent(new CustomEvent('change', {
                    detail: { position: possiblePos, size: initSize },
                }));
            }
        };
    };
    fader.appendChild(thumb);
    return fader;
}
exports.default = createFader;
