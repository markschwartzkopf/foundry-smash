"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = __importDefault(require("dgram"));
const nodecg = require('./nodecg-api-context').get();
const x32replicant = nodecg.Replicant('x32');
const commentaryChannels = ['03', '04'];
const commentaryBusses = ['09', '11'];
let connected = false;
let x32Socket = dgram_1.default.createSocket({ type: 'udp4', reuseAddr: true });
x32Socket.bind(52361, '0.0.0.0', () => {
    x32Socket.connect(10023, '172.19.1.102', () => {
        connected = true;
        let subBuffer = strToBuf('/xremote');
        send(subBuffer);
        let renewSub = setInterval(() => {
            send(subBuffer);
        }, 9000);
        x32Socket.on('message', (msg, rinfo) => {
            console.log('yo:' + msg.toString());
            let index = msg.indexOf(0x00);
            let command = msg.toString('utf-8', 0, index);
            index = index + 4 - (index % 4);
            let msg2 = msg.slice(index);
            switch (command) {
                case 'node':
                    console.error('code me x32node');
                    break;
                case '/':
                    console.error('code me x32 /');
                    break;
                default:
                    //assume command is a leaf from /xremote subscription
                    let x32Address = command.slice(1);
                    if (x32Address[0] == '-') {
                        console.log('From X32:' + command + ' | ' + msg2.toString('utf-8'));
                    }
                    else {
                        index = msg2.indexOf(0x00);
                        let oscFormat = msg2.toString('utf-8', 1, index); //starts at 1 to chop off leading comma
                        index = index + 4 - (index % 4);
                        msg2 = msg2.slice(index);
                        switch (x32Address) {
                            case 'ch/' + commentaryChannels[0] + '/mix/on':
                                if (oscFormat != 'i') {
                                    console.error('Invalid mute info from x32');
                                }
                                else {
                                    let value = msg2.readInt32BE();
                                    console.log(msg2.length);
                                    x32replicant.value.commentary[0].on = Boolean(value);
                                }
                                break;
                            case 'ch/' + commentaryChannels[1] + '/mix/on':
                                if (oscFormat != 'i') {
                                    console.error('Invalid mute info from x32');
                                }
                                else {
                                    let value = msg2.readInt32BE();
                                    x32replicant.value.commentary[1].on = Boolean(value);
                                }
                                break;
                            case 'bus/' + commentaryBusses[0] + '/mix/fader':
                                if (oscFormat != 'f') {
                                    console.error('Invalid fader info from x32');
                                }
                                else {
                                    let value = msg2.readFloatBE();
                                    x32replicant.value.commentary[0].level = value;
                                }
                                break;
                            case 'bus/' + commentaryBusses[1] + '/mix/fader':
                                if (oscFormat != 'f') {
                                    console.error('Invalid fader info from x32');
                                }
                                else {
                                    let value = msg2.readFloatBE();
                                    x32replicant.value.commentary[1].level = value;
                                }
                                break;
                            default:
                            //console.log('non-pertinent info:' + x32Address);
                        }
                    }
            }
        });
    });
});
nodecg.listenFor('x32adjust', (value, ack) => {
    let newReplicant = value;
    if (newReplicant.commentary[0].on != x32replicant.value.commentary[0].on) {
        let data = 0;
        if (newReplicant.commentary[0].on)
            data = 1;
        let cmdBuf = strToBuf('/ch/' + commentaryChannels[0] + '/mix/on');
        let typeBuf = strToBuf(',i');
        let dataBuf = Buffer.allocUnsafe(4);
        dataBuf.writeInt32BE(data);
        let toX32 = Buffer.concat([cmdBuf, typeBuf, dataBuf]);
        send(toX32);
    }
    if (newReplicant.commentary[1].on != x32replicant.value.commentary[1].on) {
        let data = 0;
        if (newReplicant.commentary[1].on)
            data = 1;
        let cmdBuf = strToBuf('/ch/' + commentaryChannels[1] + '/mix/on');
        let typeBuf = strToBuf(',i');
        let dataBuf = Buffer.allocUnsafe(4);
        dataBuf.writeInt32BE(data);
        let toX32 = Buffer.concat([cmdBuf, typeBuf, dataBuf]);
        send(toX32);
    }
    if (newReplicant.commentary[0].level != x32replicant.value.commentary[0].level) {
        let cmdBuf = strToBuf('/bus/' + commentaryBusses[0] + '/mix/fader');
        let typeBuf = strToBuf(',f');
        let dataBuf = Buffer.allocUnsafe(4);
        dataBuf.writeFloatBE(newReplicant.commentary[0].level);
        let toX32 = Buffer.concat([cmdBuf, typeBuf, dataBuf]);
        send(toX32);
    }
    if (newReplicant.commentary[1].level != x32replicant.value.commentary[1].level) {
        let cmdBuf = strToBuf('/bus/' + commentaryBusses[1] + '/mix/fader');
        let typeBuf = strToBuf(',f');
        let dataBuf = Buffer.allocUnsafe(4);
        dataBuf.writeFloatBE(newReplicant.commentary[1].level);
        let toX32 = Buffer.concat([cmdBuf, typeBuf, dataBuf]);
        send(toX32);
    }
    x32replicant.value = value;
});
function send(msg) {
    if (connected) {
        x32Socket.send(msg, (err) => {
            if (err)
                console.error(err);
        });
    }
    else
        console.error('Can\'t send data to X32 unless connected');
}
function strToBuf(str) {
    let buf = Buffer.from(str);
    let bufPad = Buffer.alloc(4 - (buf.length % 4));
    return Buffer.concat([buf, bufPad]);
}
