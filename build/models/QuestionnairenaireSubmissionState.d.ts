/**
 * QuestionnairenaireSubmission states inferred from RFC 0113.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0113-question-answer/README.md
 */
export declare enum QuestionnairenaireSubmissionState {
    QuestionnaireSent = "question-sent",
    QuestionnaireReceived = "question-received",
    SubmissionReceived = "answer-received",
    SubmissionSent = "answer-sent"
}
