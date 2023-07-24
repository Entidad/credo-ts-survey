"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarMessageHandler = void 0;
const messages_1 = require("../messages");
class BarMessageHandler {
    constructor(questionBarService) {
        this.supportedMessages = [messages_1.BarMessage];
        this.questionBarService = questionBarService;
    }
    async handle(messageContext) {
        await this.questionBarService.receiveBar(messageContext);
    }
}
exports.BarMessageHandler = BarMessageHandler;
//# sourceMappingURL=BarMessageHandler.js.map