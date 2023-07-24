import type { ValidResponse } from '../models';
import type { AgentContext, InboundMessageContext, Query } from '@aries-framework/core';
import { EventEmitter, Logger } from '@aries-framework/core';
import { SubmissionMessage, QuestionnaireMessage } from '../messages';
import { QuestionnairenaireSubmissionRepository, QuestionnairenaireSubmissionRecord } from '../repository';
export declare class QuestionnairenaireSubmissionService {
    private questionSubmissionRepository;
    private eventEmitter;
    private logger;
    constructor(questionSubmissionRepository: QuestionnairenaireSubmissionRepository, eventEmitter: EventEmitter, logger: Logger);
    /**
     * Create a question message and a new QuestionnairenaireSubmission record for the questioner role
     *
     * @param question text for question message
     * @param details optional details for question message
     * @param connectionId connection for QuestionnairenaireSubmission record
     * @param validResponses array of valid responses for question
     * @returns question message and QuestionnairenaireSubmission record
     */
    createQuestionnaire(agentContext: AgentContext, connectionId: string, config: {
        question: string;
        validResponses: ValidResponse[];
        detail?: string;
    }): Promise<{
        questionMessage: QuestionnaireMessage;
        questionSubmissionRecord: QuestionnairenaireSubmissionRecord;
    }>;
    /**
     * receive question message and create record for responder role
     *
     * @param messageContext the message context containing a question message
     * @returns QuestionnairenaireSubmission record
     */
    processReceiveQuestionnaire(messageContext: InboundMessageContext<QuestionnaireMessage>): Promise<QuestionnairenaireSubmissionRecord>;
    /**
     * create answer message, check that response is valid
     *
     * @param questionSubmissionRecord record containing question and valid responses
     * @param response response used in answer message
     * @returns answer message and QuestionnairenaireSubmission record
     */
    createSubmission(agentContext: AgentContext, questionSubmissionRecord: QuestionnairenaireSubmissionRecord, response: string): Promise<{
        answerMessage: SubmissionMessage;
        questionSubmissionRecord: QuestionnairenaireSubmissionRecord;
    }>;
    /**
     * receive answer as questioner
     *
     * @param messageContext the message context containing an answer message message
     * @returns QuestionnairenaireSubmission record
     */
    receiveSubmission(messageContext: InboundMessageContext<SubmissionMessage>): Promise<QuestionnairenaireSubmissionRecord>;
    /**
     * Update the record to a new state and emit an state changed event. Also updates the record
     * in storage.
     *
     * @param questionSubmissionRecord The question answer record to update the state for
     * @param newState The state to update to
     *
     */
    private updateState;
    private createRecord;
    /**
     * Retrieve a question answer record by connection id and thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @throws {RecordNotFoundError} If no record is found
     * @throws {RecordDuplicateError} If multiple records are found
     * @returns The question answer record
     */
    getByThreadAndConnectionId(agentContext: AgentContext, connectionId: string, threadId: string): Promise<QuestionnairenaireSubmissionRecord>;
    /**
     * Retrieve a question answer record by thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @returns The question answer record or null if not found
     */
    findByThreadAndConnectionId(agentContext: AgentContext, connectionId: string, threadId: string): Promise<QuestionnairenaireSubmissionRecord | null>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionSubmissionId The questionSubmission record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The question answer record
     *
     */
    getById(agentContext: AgentContext, questionSubmissionId: string): Promise<QuestionnairenaireSubmissionRecord>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionSubmissionId The questionSubmission record id
     * @return The question answer record or null if not found
     *
     */
    findById(agentContext: AgentContext, questionSubmissionId: string): Promise<QuestionnairenaireSubmissionRecord | null>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionSubmissionId The questionSubmission record id
     * @return The question answer record or null if not found
     *
     */
    getAll(agentContext: AgentContext): Promise<QuestionnairenaireSubmissionRecord[]>;
    findAllByQuery(agentContext: AgentContext, query: Query<QuestionnairenaireSubmissionRecord>): Promise<QuestionnairenaireSubmissionRecord[]>;
}
