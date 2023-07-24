"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireMessageHandler = void 0;
const messages_1 = require("../messages");
class QuestionnaireMessageHandler {
    constructor(questionSubmissionService) {
        this.supportedMessages = [messages_1.QuestionnaireMessage];
        this.questionSubmissionService = questionSubmissionService;
    }
    async handle(messageContext) {
        await this.questionSubmissionService.processReceiveQuestionnaire(messageContext);
    }
}
exports.QuestionnaireMessageHandler = QuestionnaireMessageHandler;
//# sourceMappingURL=QuestionnaireMessageHandler.js.map