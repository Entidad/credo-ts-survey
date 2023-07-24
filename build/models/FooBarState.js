"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooBarState = void 0;
/**
 * FooBar states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-question-answer/README.md
 */
var FooBarState;
(function (FooBarState) {
    FooBarState["FooSent"] = "question-sent";
    FooBarState["FooReceived"] = "question-received";
    FooBarState["BarReceived"] = "answer-received";
    FooBarState["BarSent"] = "answer-sent";
})(FooBarState = exports.FooBarState || (exports.FooBarState = {}));
//# sourceMappingURL=FooBarState.js.map