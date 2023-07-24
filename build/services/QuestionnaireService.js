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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireService = void 0;
const core_1 = require("@aries-framework/core");
const QuestionnaireEvents_1 = require("../QuestionnaireEvents");
const QuestionnaireRole_1 = require("../QuestionnaireRole");
const messages_1 = require("../messages");
const models_1 = require("../models");
const repository_1 = require("../repository");
let QuestionnaireService = class QuestionnaireService {
    constructor(questionnaireRepository, eventEmitter, logger) {
        this.questionnaireRepository = questionnaireRepository;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
        this.logger.warn("The '@entidad/questionnaire' module is experimental and could have unexpected breaking changes. When using this module, make sure to use strict versions for all @entidad packages.");
    }
    /**
     * Create a question message and a new Questionnaire record for the questioner role
     *
     * @param question text for question message
     * @param details optional details for question message
     * @param connectionId connection for Questionnaire record
     * @param validResponses array of valid responses for question
     * @returns question message and Questionnaire record
     */
    async createQuestion(agentContext, connectionId, config) {
        const questionMessage = new messages_1.QuestionMessage({
            questionText: config.question,
            questionDetail: config === null || config === void 0 ? void 0 : config.detail,
            signatureRequired: false,
            validResponses: config.validResponses,
        });
        const questionnaireRecord = await this.createRecord({
            questionText: questionMessage.questionText,
            questionDetail: questionMessage.questionDetail,
            threadId: questionMessage.threadId,
            connectionId: connectionId,
            role: QuestionnaireRole_1.QuestionnaireRole.Questioner,
            signatureRequired: false,
            state: models_1.QuestionnaireState.QuestionSent,
            validResponses: questionMessage.validResponses,
        });
        await this.questionnaireRepository.save(agentContext, questionnaireRecord);
        this.eventEmitter.emit(agentContext, {
            type: QuestionnaireEvents_1.QuestionnaireEventTypes.QuestionnaireStateChanged,
            payload: { previousState: null, questionnaireRecord },
        });
        return { questionMessage, questionnaireRecord };
    }
    /**
     * receive question message and create record for responder role
     *
     * @param messageContext the message context containing a question message
     * @returns Questionnaire record
     */
    async processReceiveQuestion(messageContext) {
        const { message: questionMessage } = messageContext;
        this.logger.debug(`Receiving question message with id ${questionMessage.id}`);
        const connection = messageContext.assertReadyConnection();
        const questionRecord = await this.findByThreadAndConnectionId(messageContext.agentContext, connection.id, questionMessage.id);
        if (questionRecord) {
            throw new core_1.AriesFrameworkError(`Question answer record with thread Id ${questionMessage.id} already exists.`);
        }
        const questionnaireRecord = await this.createRecord({
            questionText: questionMessage.questionText,
            questionDetail: questionMessage.questionDetail,
            connectionId: connection === null || connection === void 0 ? void 0 : connection.id,
            threadId: questionMessage.threadId,
            role: QuestionnaireRole_1.QuestionnaireRole.Responder,
            signatureRequired: false,
            state: models_1.QuestionnaireState.QuestionReceived,
            validResponses: questionMessage.validResponses,
        });
        await this.questionnaireRepository.save(messageContext.agentContext, questionnaireRecord);
        this.eventEmitter.emit(messageContext.agentContext, {
            type: QuestionnaireEvents_1.QuestionnaireEventTypes.QuestionnaireStateChanged,
            payload: { previousState: null, questionnaireRecord },
        });
        return questionnaireRecord;
    }
    /**
     * create answer message, check that response is valid
     *
     * @param questionnaireRecord record containing question and valid responses
     * @param response response used in answer message
     * @returns answer message and Questionnaire record
     */
    async createAnswer(agentContext, questionnaireRecord, response) {
        const answerMessage = new messages_1.AnswerMessage({ response: response, threadId: questionnaireRecord.threadId });
        questionnaireRecord.assertState(models_1.QuestionnaireState.QuestionReceived);
        questionnaireRecord.response = response;
        if (questionnaireRecord.validResponses.some((e) => e.text === response)) {
            await this.updateState(agentContext, questionnaireRecord, models_1.QuestionnaireState.AnswerSent);
        }
        else {
            throw new core_1.AriesFrameworkError(`Response does not match valid responses`);
        }
        return { answerMessage, questionnaireRecord };
    }
    /**
     * receive answer as questioner
     *
     * @param messageContext the message context containing an answer message message
     * @returns Questionnaire record
     */
    async receiveAnswer(messageContext) {
        const { message: answerMessage } = messageContext;
        this.logger.debug(`Receiving answer message with id ${answerMessage.id}`);
        const connection = messageContext.assertReadyConnection();
        const questionnaireRecord = await this.findByThreadAndConnectionId(messageContext.agentContext, connection.id, answerMessage.threadId);
        if (!questionnaireRecord) {
            throw new core_1.AriesFrameworkError(`Question Answer record with thread Id ${answerMessage.threadId} not found.`);
        }
        questionnaireRecord.assertState(models_1.QuestionnaireState.QuestionSent);
        questionnaireRecord.assertRole(QuestionnaireRole_1.QuestionnaireRole.Questioner);
        questionnaireRecord.response = answerMessage.response;
        await this.updateState(messageContext.agentContext, questionnaireRecord, models_1.QuestionnaireState.AnswerReceived);
        return questionnaireRecord;
    }
    /**
     * Update the record to a new state and emit an state changed event. Also updates the record
     * in storage.
     *
     * @param questionnaireRecord The question answer record to update the state for
     * @param newState The state to update to
     *
     */
    async updateState(agentContext, questionnaireRecord, newState) {
        const previousState = questionnaireRecord.state;
        questionnaireRecord.state = newState;
        await this.questionnaireRepository.update(agentContext, questionnaireRecord);
        this.eventEmitter.emit(agentContext, {
            type: QuestionnaireEvents_1.QuestionnaireEventTypes.QuestionnaireStateChanged,
            payload: {
                previousState,
                questionnaireRecord: questionnaireRecord,
            },
        });
    }
    async createRecord(options) {
        const questionMessageRecord = new repository_1.QuestionnaireRecord({
            questionText: options.questionText,
            questionDetail: options.questionDetail,
            connectionId: options.connectionId,
            threadId: options.threadId,
            role: options.role,
            signatureRequired: options.signatureRequired,
            state: options.state,
            validResponses: options.validResponses,
        });
        return questionMessageRecord;
    }
    /**
     * Retrieve a question answer record by connection id and thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @throws {RecordNotFoundError} If no record is found
     * @throws {RecordDuplicateError} If multiple records are found
     * @returns The question answer record
     */
    getByThreadAndConnectionId(agentContext, connectionId, threadId) {
        return this.questionnaireRepository.getSingleByQuery(agentContext, {
            connectionId,
            threadId,
        });
    }
    /**
     * Retrieve a question answer record by thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @returns The question answer record or null if not found
     */
    findByThreadAndConnectionId(agentContext, connectionId, threadId) {
        return this.questionnaireRepository.findSingleByQuery(agentContext, {
            connectionId,
            threadId,
        });
    }
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The question answer record
     *
     */
    getById(agentContext, questionnaireId) {
        return this.questionnaireRepository.getById(agentContext, questionnaireId);
    }
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @return The question answer record or null if not found
     *
     */
    findById(agentContext, questionnaireId) {
        return this.questionnaireRepository.findById(agentContext, questionnaireId);
    }
    /**
     * Retrieve a question answer record by id
     *
     * @param questionnaireId The questionnaire record id
     * @return The question answer record or null if not found
     *
     */
    getAll(agentContext) {
        return this.questionnaireRepository.getAll(agentContext);
    }
    async findAllByQuery(agentContext, query) {
        return this.questionnaireRepository.findByQuery(agentContext, query);
    }
};
QuestionnaireService = __decorate([
    (0, core_1.injectable)(),
    __param(2, (0, core_1.inject)(core_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [repository_1.QuestionnaireRepository,
        core_1.EventEmitter, Object])
], QuestionnaireService);
exports.QuestionnaireService = QuestionnaireService;
//# sourceMappingURL=QuestionnaireService.js.map