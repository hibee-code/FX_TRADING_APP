"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathFromSrc = void 0;
const path_1 = require("path");
const pathFromSrc = (path) => {
    return (0, path_1.join)(__dirname, '../../', path);
};
exports.pathFromSrc = pathFromSrc;
//# sourceMappingURL=general.js.map