import type { QuestionnairenaireSubmissionRecord } from './repository';
import type { Query } from '@aries-framework/core';
import { AgentContext, ConnectionService, MessageSender } from '@aries-framework/core';
import { ValidResponse } from './models';
import { QuestionnairenaireSubmissionService } from './services';
export declare class QuestionnairenaireSubmissionApi {
    private questionSubmissionService;
    private messageSender;
    private connectionService;
    private agentContext;
    constructor(questionSubmissionService: QuestionnairenaireSubmissionService, messageSender: MessageSender, connectionService: ConnectionService, agentContext: AgentContext);
    /**
     * Create a question message with possible valid responses, then send message to the
     * holder
     *
     * @param connectionId connection to send the question message to
     * @param config config for creating question message
     * @returns QuestionnairenaireSubmission record
     */
    sendQuestionnaire(connectionId: string, config: {
        question: string;
        validResponses: ValidResponse[];
        detail?: string;
    }): Promise<QuestionnairenaireSubmissionRecord>;
    /**
     * Create an answer message as the holder and send it in response to a question message
     *
     * @param questionRecordId the id of the questionSubmission record
     * @param response response included in the answer message
     * @returns QuestionnairenaireSubmission record
     */
    sendSubmission(questionRecordId: string, response: string): Promise<QuestionnairenaireSubmissionRecord>;
    /**
     * Get all QuestionnairenaireSubmission records
     *
     * @returns list containing all QuestionnairenaireSubmission records
     */
    getAll(): Promise<QuestionnairenaireSubmissionRecord[]>;
    /**
     * Get all QuestionnairenaireSubmission records by specified query params
     *
     * @returns list containing all QuestionnairenaireSubmission records matching specified query params
     */
    findAllByQuery(query: Query<QuestionnairenaireSubmissionRecord>): Promise<QuestionnairenaireSubmissionRecord[]>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionSubmissionId The questionSubmission record id
     * @return The question answer record or null if not found
     *
     */
    findById(questionSubmissionId: string): Promise<QuestionnairenaireSubmissionRecord | null>;
}
