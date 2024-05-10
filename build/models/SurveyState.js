"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyState = void 0;
/**
 * Questionnaire states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-question-answer/README.md
 */
var SurveyState;
(function (SurveyState) {
    SurveyState["QuestionSent"] = "question-sent";
    SurveyState["QuestionReceived"] = "question-received";
    SurveyState["AnswerReceived"] = "answer-received";
    SurveyState["AnswerSent"] = "answer-sent";
})(SurveyState = exports.SurveyState || (exports.SurveyState = {}));
//# sourceMappingURL=SurveyState.js.map