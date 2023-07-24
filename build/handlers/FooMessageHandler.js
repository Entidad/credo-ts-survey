"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FooMessageHandler = void 0;
const messages_1 = require("../messages");
class FooMessageHandler {
    constructor(questionBarService) {
        this.supportedMessages = [messages_1.FooMessage];
        this.questionBarService = questionBarService;
    }
    async handle(messageContext) {
        await this.questionBarService.processReceiveFoo(messageContext);
    }
}
exports.FooMessageHandler = FooMessageHandler;
//# sourceMappingURL=FooMessageHandler.js.map