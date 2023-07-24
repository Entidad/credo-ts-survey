"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionMessageHandler = void 0;
const messages_1 = require("../messages");
class QuestionMessageHandler {
    constructor(questionnaireService) {
        this.supportedMessages = [messages_1.QuestionMessage];
        this.questionnaireService = questionnaireService;
    }
    async handle(messageContext) {
        await this.questionnaireService.processReceiveQuestion(messageContext);
    }
}
exports.QuestionMessageHandler = QuestionMessageHandler;
//# sourceMappingURL=QuestionMessageHandler.js.map