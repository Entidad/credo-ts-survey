"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireApi = void 0;
const core_1 = require("@aries-framework/core");
const handlers_1 = require("./handlers");
const models_1 = require("./models");
const services_1 = require("./services");
let QuestionnaireApi = class QuestionnaireApi {
    constructor(questionnaireService, messageSender, connectionService, agentContext) {
        this.questionnaireService = questionnaireService;
        this.messageSender = messageSender;
        this.connectionService = connectionService;
        this.agentContext = agentContext;
        this.agentContext.dependencyManager.registerMessageHandlers([
            new handlers_1.QuestionMessageHandler(this.questionnaireService),
            new handlers_1.AnswerMessageHandler(this.questionnaireService),
        ]);
    }
    /**
     * Create a question message with possible valid responses, then send message to the
     * holder
     *
     * @param connectionId connection to send the question message to
     * @param config config for creating question message
     * @returns Questionnaire record
     */
    async sendQuestion(connectionId, config) {
        const connection = await this.connectionService.getById(this.agentContext, connectionId);
        connection.assertReady();
        const { questionMessage, questionnaireRecord } = await this.questionnaireService.createQuestion(this.agentContext, connectionId, {
            question: config.question,
            validResponses: config.validResponses.map((item) => new models_1.ValidResponse(item)),
            detail: config === null || config === void 0 ? void 0 : config.detail,
            questions: config.questions, //entidad
        });
        const outboundMessageContext = new core_1.OutboundMessageContext(questionMessage, {
            agentContext: this.agentContext,
            connection,
            associatedRecord: questionnaireRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return questionnaireRecord;
    }
    /**
     * Create an answer message as the holder and send it in response to a question message
     *
     * @param questionRecordId the id of the questionnaire record
     * @param response response included in the answer message
     * @returns Questionnaire record
     */
    async sendAnswer(questionRecordId, response) {
        const questionRecord = await this.questionnaireService.getById(this.agentContext, questionRecordId);
        const { answerMessage, questionnaireRecord } = await this.questionnaireService.createAnswer(this.agentContext, questionRecord, response);
        const connection = await this.connectionService.getById(this.agentContext, questionRecord.connectionId);
        const outboundMessageContext = new core_1.OutboundMessageContext(answerMessage, {
            agentContext: this.agentContext,
            connection,
            associatedRecord: questionnaireRecord,
        });
        await this.messageSender.sendMessage(outboundMessageContext);
        return questionnaireRecord;
    }
    /**
     * Get all Questionnaire records
     *
     * @returns list containing all Questionnaire records
     */
    getAll() {
        return this.questionnaireService.getAll(this.agentContext);
    }
    /**
     * Get all Questionnaire records by specified query params
     *
     * @returns list containing all Questionnaire records matching specified query params
     */
    findAllByQuery(query) {
        return this.questionnaireService.findAllByQuery(this.agentContext, query);
    }
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @return The question answer record or null if not found
     *
     */
    findById(questionnaireId) {
        return this.questionnaireService.findById(this.agentContext, questionnaireId);
    }
};
QuestionnaireApi = __decorate([
    (0, core_1.injectable)(),
    __metadata("design:paramtypes", [services_1.QuestionnaireService,
        core_1.MessageSender,
        core_1.ConnectionService,
        core_1.AgentContext])
], QuestionnaireApi);
exports.QuestionnaireApi = QuestionnaireApi;
//# sourceMappingURL=QuestionnaireApi.js.map