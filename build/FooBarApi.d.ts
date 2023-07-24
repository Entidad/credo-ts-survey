import type { FooBarRecord } from './repository';
import type { Query } from '@aries-framework/core';
import { AgentContext, ConnectionService, MessageSender } from '@aries-framework/core';
import { ValidResponse } from './models';
import { FooBarService } from './services';
export declare class FooBarApi {
    private questionBarService;
    private messageSender;
    private connectionService;
    private agentContext;
    constructor(questionBarService: FooBarService, messageSender: MessageSender, connectionService: ConnectionService, agentContext: AgentContext);
    /**
     * Create a question message with possible valid responses, then send message to the
     * holder
     *
     * @param connectionId connection to send the question message to
     * @param config config for creating question message
     * @returns FooBar record
     */
    sendFoo(connectionId: string, config: {
        question: string;
        validResponses: ValidResponse[];
        detail?: string;
    }): Promise<FooBarRecord>;
    /**
     * Create an answer message as the holder and send it in response to a question message
     *
     * @param questionRecordId the id of the questionBar record
     * @param response response included in the answer message
     * @returns FooBar record
     */
    sendBar(questionRecordId: string, response: string): Promise<FooBarRecord>;
    /**
     * Get all FooBar records
     *
     * @returns list containing all FooBar records
     */
    getAll(): Promise<FooBarRecord[]>;
    /**
     * Get all FooBar records by specified query params
     *
     * @returns list containing all FooBar records matching specified query params
     */
    findAllByQuery(query: Query<FooBarRecord>): Promise<FooBarRecord[]>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionBarId The questionBar record id
     * @return The question answer record or null if not found
     *
     */
    findById(questionBarId: string): Promise<FooBarRecord | null>;
}
