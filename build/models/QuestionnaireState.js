"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireState = void 0;
/**
 * Questionnaire states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-question-answer/README.md
 */
var QuestionnaireState;
(function (QuestionnaireState) {
    QuestionnaireState["QuestionSent"] = "question-sent";
    QuestionnaireState["QuestionReceived"] = "question-received";
    QuestionnaireState["AnswerReceived"] = "answer-received";
    QuestionnaireState["AnswerSent"] = "answer-sent";
})(QuestionnaireState = exports.QuestionnaireState || (exports.QuestionnaireState = {}));
//# sourceMappingURL=QuestionnaireState.js.map