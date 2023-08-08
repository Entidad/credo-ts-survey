import type { ValidResponse } from '../models';
import type { AgentContext, InboundMessageContext, Query } from '@aries-framework/core';
import { EventEmitter, Logger } from '@aries-framework/core';
import { AnswerMessage, QuestionMessage } from '../messages';
import { QuestionnaireRepository, QuestionnaireRecord } from '../repository';
export declare class QuestionnaireService {
    private questionnaireRepository;
    private eventEmitter;
    private logger;
    constructor(questionnaireRepository: QuestionnaireRepository, eventEmitter: EventEmitter, logger: Logger);
    /**
     * Create a question message and a new Questionnaire record for the questioner role
     *
     * @param question text for question message
     * @param details optional details for question message
     * @param connectionId connection for Questionnaire record
     * @param validResponses array of valid responses for question
     * @returns question message and Questionnaire record
     */
    createQuestion(agentContext: AgentContext, connectionId: string, config: {
        questions: {
            questionText: string;
            questionDetail?: string;
            validResponses: ValidResponse[];
        }[];
    }): Promise<{
        questionMessage: QuestionMessage;
        questionnaireRecord: QuestionnaireRecord;
    }>;
    /**
     * receive question message and create record for responder role
     *
     * @param messageContext the message context containing a question message
     * @returns Questionnaire record
     */
    processReceiveQuestion(messageContext: InboundMessageContext<QuestionMessage>): Promise<QuestionnaireRecord>;
    /**
     * create answer message, check that response is valid
     *
     * @param questionnaireRecord record containing question and valid responses
     * @param response response used in answer message
     * @returns answer message and Questionnaire record
     */
    createAnswer(agentContext: AgentContext, questionnaireRecord: QuestionnaireRecord, response: string): Promise<{
        answerMessage: AnswerMessage;
        questionnaireRecord: QuestionnaireRecord;
    }>;
    /**
     * receive answer as questioner
     *
     * @param messageContext the message context containing an answer message message
     * @returns Questionnaire record
     */
    receiveAnswer(messageContext: InboundMessageContext<AnswerMessage>): Promise<QuestionnaireRecord>;
    /**
     * Update the record to a new state and emit an state changed event. Also updates the record
     * in storage.
     *
     * @param questionnaireRecord The question answer record to update the state for
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
    getByThreadAndConnectionId(agentContext: AgentContext, connectionId: string, threadId: string): Promise<QuestionnaireRecord>;
    /**
     * Retrieve a question answer record by thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @returns The question answer record or null if not found
     */
    findByThreadAndConnectionId(agentContext: AgentContext, connectionId: string, threadId: string): Promise<QuestionnaireRecord | null>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The question answer record
     *
     */
    getById(agentContext: AgentContext, questionnaireId: string): Promise<QuestionnaireRecord>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @return The question answer record or null if not found
     *
     */
    findById(agentContext: AgentContext, questionnaireId: string): Promise<QuestionnaireRecord | null>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @return The question answer record or null if not found
     *
     */
    getAll(agentContext: AgentContext): Promise<QuestionnaireRecord[]>;
    findAllByQuery(agentContext: AgentContext, query: Query<QuestionnaireRecord>): Promise<QuestionnaireRecord[]>;
}
