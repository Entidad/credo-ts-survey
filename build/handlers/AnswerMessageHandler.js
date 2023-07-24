"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerMessageHandler = void 0;
const messages_1 = require("../messages");
class AnswerMessageHandler {
    constructor(questionnaireService) {
        this.supportedMessages = [messages_1.AnswerMessage];
        this.questionnaireService = questionnaireService;
    }
    async handle(messageContext) {
        await this.questionnaireService.receiveAnswer(messageContext);
    }
}
exports.AnswerMessageHandler = AnswerMessageHandler;
//# sourceMappingURL=AnswerMessageHandler.js.map