"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnairenaireSubmissionState = void 0;
/**
 * QuestionnairenaireSubmission states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-question-answer/README.md
 */
var QuestionnairenaireSubmissionState;
(function (QuestionnairenaireSubmissionState) {
    QuestionnairenaireSubmissionState["QuestionnaireSent"] = "question-sent";
    QuestionnairenaireSubmissionState["QuestionnaireReceived"] = "question-received";
    QuestionnairenaireSubmissionState["SubmissionReceived"] = "answer-received";
    QuestionnairenaireSubmissionState["SubmissionSent"] = "answer-sent";
})(QuestionnairenaireSubmissionState = exports.QuestionnairenaireSubmissionState || (exports.QuestionnairenaireSubmissionState = {}));
//# sourceMappingURL=QuestionnairenaireSubmissionState.js.map