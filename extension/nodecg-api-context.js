"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.set = set;
let context;
function get() {
    return context;
}
function set(ctx) {
    context = ctx;
}
