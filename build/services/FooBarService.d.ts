import type { ValidResponse } from '../models';
import type { AgentContext, InboundMessageContext, Query } from '@aries-framework/core';
import { EventEmitter, Logger } from '@aries-framework/core';
import { BarMessage, FooMessage } from '../messages';
import { FooBarRepository, FooBarRecord } from '../repository';
export declare class FooBarService {
    private questionBarRepository;
    private eventEmitter;
    private logger;
    constructor(questionBarRepository: FooBarRepository, eventEmitter: EventEmitter, logger: Logger);
    /**
     * Create a question message and a new FooBar record for the questioner role
     *
     * @param question text for question message
     * @param details optional details for question message
     * @param connectionId connection for FooBar record
     * @param validResponses array of valid responses for question
     * @returns question message and FooBar record
     */
    createFoo(agentContext: AgentContext, connectionId: string, config: {
        question: string;
        validResponses: ValidResponse[];
        detail?: string;
    }): Promise<{
        questionMessage: FooMessage;
        questionBarRecord: FooBarRecord;
    }>;
    /**
     * receive question message and create record for responder role
     *
     * @param messageContext the message context containing a question message
     * @returns FooBar record
     */
    processReceiveFoo(messageContext: InboundMessageContext<FooMessage>): Promise<FooBarRecord>;
    /**
     * create answer message, check that response is valid
     *
     * @param questionBarRecord record containing question and valid responses
     * @param response response used in answer message
     * @returns answer message and FooBar record
     */
    createBar(agentContext: AgentContext, questionBarRecord: FooBarRecord, response: string): Promise<{
        answerMessage: BarMessage;
        questionBarRecord: FooBarRecord;
    }>;
    /**
     * receive answer as questioner
     *
     * @param messageContext the message context containing an answer message message
     * @returns FooBar record
     */
    receiveBar(messageContext: InboundMessageContext<BarMessage>): Promise<FooBarRecord>;
    /**
     * Update the record to a new state and emit an state changed event. Also updates the record
     * in storage.
     *
     * @param questionBarRecord The question answer record to update the state for
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
    getByThreadAndConnectionId(agentContext: AgentContext, connectionId: string, threadId: string): Promise<FooBarRecord>;
    /**
     * Retrieve a question answer record by thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @returns The question answer record or null if not found
     */
    findByThreadAndConnectionId(agentContext: AgentContext, connectionId: string, threadId: string): Promise<FooBarRecord | null>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionBarId The questionBar record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The question answer record
     *
     */
    getById(agentContext: AgentContext, questionBarId: string): Promise<FooBarRecord>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionBarId The questionBar record id
     * @return The question answer record or null if not found
     *
     */
    findById(agentContext: AgentContext, questionBarId: string): Promise<FooBarRecord | null>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionBarId The questionBar record id
     * @return The question answer record or null if not found
     *
     */
    getAll(agentContext: AgentContext): Promise<FooBarRecord[]>;
    findAllByQuery(agentContext: AgentContext, query: Query<FooBarRecord>): Promise<FooBarRecord[]>;
}
