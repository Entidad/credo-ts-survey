import type { QuestionnaireRecord } from './repository';
import type { Query } from '@aries-framework/core';
import { AgentContext, ConnectionService, MessageSender } from '@aries-framework/core';
import { ValidResponse } from './models';
import { QuestionnaireService } from './services';
export declare class QuestionnaireApi {
    private questionnaireService;
    private messageSender;
    private connectionService;
    private agentContext;
    constructor(questionnaireService: QuestionnaireService, messageSender: MessageSender, connectionService: ConnectionService, agentContext: AgentContext);
    /**
     * Create a question message with possible valid responses, then send message to the
     * holder
     *
     * @param connectionId connection to send the question message to
     * @param config config for creating question message
     * @returns Questionnaire record
     */
    sendQuestion(connectionId: string, config: {
        questions: {
            questionText: string;
            questionDetail?: string;
            validResponses: ValidResponse[];
        }[];
    }): Promise<QuestionnaireRecord>;
    /**
     * Create an answer message as the holder and send it in response to a question message
     *
     * @param questionRecordId the id of the questionnaire record
     * @param response response included in the answer message
     * @returns Questionnaire record
     */
    sendAnswer(questionRecordId: string, response: string[]): Promise<QuestionnaireRecord>;
    /**
     * Get all Questionnaire records
     *
     * @returns list containing all Questionnaire records
     */
    getAll(): Promise<QuestionnaireRecord[]>;
    /**
     * Get all Questionnaire records by specified query params
     *
     * @returns list containing all Questionnaire records matching specified query params
     */
    findAllByQuery(query: Query<QuestionnaireRecord>): Promise<QuestionnaireRecord[]>;
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @return The question answer record or null if not found
     *
     */
    findById(questionnaireId: string): Promise<QuestionnaireRecord | null>;
}
