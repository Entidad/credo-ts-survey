"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionMessageHandler = void 0;
const messages_1 = require("../messages");
class SubmissionMessageHandler {
    constructor(questionSubmissionService) {
        this.supportedMessages = [messages_1.SubmissionMessage];
        this.questionSubmissionService = questionSubmissionService;
    }
    async handle(messageContext) {
        await this.questionSubmissionService.receiveSubmission(messageContext);
    }
}
exports.SubmissionMessageHandler = SubmissionMessageHandler;
//# sourceMappingURL=SubmissionMessageHandler.js.map