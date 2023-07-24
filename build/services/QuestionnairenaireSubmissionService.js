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
exports.QuestionnairenaireSubmissionService = void 0;
const core_1 = require("@aries-framework/core");
const QuestionnairenaireSubmissionEvents_1 = require("../QuestionnairenaireSubmissionEvents");
const QuestionnairenaireSubmissionRole_1 = require("../QuestionnairenaireSubmissionRole");
const messages_1 = require("../messages");
const models_1 = require("../models");
const repository_1 = require("../repository");
let QuestionnairenaireSubmissionService = class QuestionnairenaireSubmissionService {
    constructor(questionSubmissionRepository, eventEmitter, logger) {
        this.questionSubmissionRepository = questionSubmissionRepository;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
    }
    /**
     * Create a question message and a new QuestionnairenaireSubmission record for the questioner role
     *
     * @param question text for question message
     * @param details optional details for question message
     * @param connectionId connection for QuestionnairenaireSubmission record
     * @param validResponses array of valid responses for question
     * @returns question message and QuestionnairenaireSubmission record
     */
    async createQuestionnaire(agentContext, connectionId, config) {
        const questionMessage = new messages_1.QuestionnaireMessage({
            questionText: config.question,
            questionDetail: config === null || config === void 0 ? void 0 : config.detail,
            signatureRequired: false,
            validResponses: config.validResponses,
        });
        const questionSubmissionRecord = await this.createRecord({
            questionText: questionMessage.questionText,
            questionDetail: questionMessage.questionDetail,
            threadId: questionMessage.threadId,
            connectionId: connectionId,
            role: QuestionnairenaireSubmissionRole_1.QuestionnairenaireSubmissionRole.Questionnaireer,
            signatureRequired: false,
            state: models_1.QuestionnairenaireSubmissionState.QuestionnaireSent,
            validResponses: questionMessage.validResponses,
        });
        await this.questionSubmissionRepository.save(agentContext, questionSubmissionRecord);
        this.eventEmitter.emit(agentContext, {
            type: QuestionnairenaireSubmissionEvents_1.QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
            payload: { previousState: null, questionSubmissionRecord },
        });
        return { questionMessage, questionSubmissionRecord };
    }
    /**
     * receive question message and create record for responder role
     *
     * @param messageContext the message context containing a question message
     * @returns QuestionnairenaireSubmission record
     */
    async processReceiveQuestionnaire(messageContext) {
        const { message: questionMessage } = messageContext;
        this.logger.debug(`Receiving question message with id ${questionMessage.id}`);
        const connection = messageContext.assertReadyConnection();
        const questionRecord = await this.findByThreadAndConnectionId(messageContext.agentContext, connection.id, questionMessage.id);
        if (questionRecord) {
            throw new core_1.AriesFrameworkError(`Questionnaire answer record with thread Id ${questionMessage.id} already exists.`);
        }
        const questionSubmissionRecord = await this.createRecord({
            questionText: questionMessage.questionText,
            questionDetail: questionMessage.questionDetail,
            connectionId: connection === null || connection === void 0 ? void 0 : connection.id,
            threadId: questionMessage.threadId,
            role: QuestionnairenaireSubmissionRole_1.QuestionnairenaireSubmissionRole.Responder,
            signatureRequired: false,
            state: models_1.QuestionnairenaireSubmissionState.QuestionnaireReceived,
            validResponses: questionMessage.validResponses,
        });
        await this.questionSubmissionRepository.save(messageContext.agentContext, questionSubmissionRecord);
        this.eventEmitter.emit(messageContext.agentContext, {
            type: QuestionnairenaireSubmissionEvents_1.QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
            payload: { previousState: null, questionSubmissionRecord },
        });
        return questionSubmissionRecord;
    }
    /**
     * create answer message, check that response is valid
     *
     * @param questionSubmissionRecord record containing question and valid responses
     * @param response response used in answer message
     * @returns answer message and QuestionnairenaireSubmission record
     */
    async createSubmission(agentContext, questionSubmissionRecord, response) {
        const answerMessage = new messages_1.SubmissionMessage({ response: response, threadId: questionSubmissionRecord.threadId });
        questionSubmissionRecord.assertState(models_1.QuestionnairenaireSubmissionState.QuestionnaireReceived);
        questionSubmissionRecord.response = response;
        if (questionSubmissionRecord.validResponses.some((e) => e.text === response)) {
            await this.updateState(agentContext, questionSubmissionRecord, models_1.QuestionnairenaireSubmissionState.SubmissionSent);
        }
        else {
            throw new core_1.AriesFrameworkError(`Response does not match valid responses`);
        }
        return { answerMessage, questionSubmissionRecord };
    }
    /**
     * receive answer as questioner
     *
     * @param messageContext the message context containing an answer message message
     * @returns QuestionnairenaireSubmission record
     */
    async receiveSubmission(messageContext) {
        const { message: answerMessage } = messageContext;
        this.logger.debug(`Receiving answer message with id ${answerMessage.id}`);
        const connection = messageContext.assertReadyConnection();
        const questionSubmissionRecord = await this.findByThreadAndConnectionId(messageContext.agentContext, connection.id, answerMessage.threadId);
        if (!questionSubmissionRecord) {
            throw new core_1.AriesFrameworkError(`Questionnaire Submission record with thread Id ${answerMessage.threadId} not found.`);
        }
        questionSubmissionRecord.assertState(models_1.QuestionnairenaireSubmissionState.QuestionnaireSent);
        questionSubmissionRecord.assertRole(QuestionnairenaireSubmissionRole_1.QuestionnairenaireSubmissionRole.Questionnaireer);
        questionSubmissionRecord.response = answerMessage.response;
        await this.updateState(messageContext.agentContext, questionSubmissionRecord, models_1.QuestionnairenaireSubmissionState.SubmissionReceived);
        return questionSubmissionRecord;
    }
    /**
     * Update the record to a new state and emit an state changed event. Also updates the record
     * in storage.
     *
     * @param questionSubmissionRecord The question answer record to update the state for
     * @param newState The state to update to
     *
     */
    async updateState(agentContext, questionSubmissionRecord, newState) {
        const previousState = questionSubmissionRecord.state;
        questionSubmissionRecord.state = newState;
        await this.questionSubmissionRepository.update(agentContext, questionSubmissionRecord);
        this.eventEmitter.emit(agentContext, {
            type: QuestionnairenaireSubmissionEvents_1.QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
            payload: {
                previousState,
                questionSubmissionRecord: questionSubmissionRecord,
            },
        });
    }
    async createRecord(options) {
        const questionMessageRecord = new repository_1.QuestionnairenaireSubmissionRecord({
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
        return this.questionSubmissionRepository.getSingleByQuery(agentContext, {
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
        return this.questionSubmissionRepository.findSingleByQuery(agentContext, {
            connectionId,
            threadId,
        });
    }
    /**
     * Retrieve a question answer record by id
     *
     * @param questionSubmissionId The questionSubmission record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The question answer record
     *
     */
    getById(agentContext, questionSubmissionId) {
        return this.questionSubmissionRepository.getById(agentContext, questionSubmissionId);
    }
    /**
     * Retrieve a question answer record by id
     *
     * @param questionSubmissionId The questionSubmission record id
     * @return The question answer record or null if not found
     *
     */
    findById(agentContext, questionSubmissionId) {
        return this.questionSubmissionRepository.findById(agentContext, questionSubmissionId);
    }
    /**
     * Retrieve a question answer record by id
     *
     * @param questionSubmissionId The questionSubmission record id
     * @return The question answer record or null if not found
     *
     */
    getAll(agentContext) {
        return this.questionSubmissionRepository.getAll(agentContext);
    }
    async findAllByQuery(agentContext, query) {
        return this.questionSubmissionRepository.findByQuery(agentContext, query);
    }
};
QuestionnairenaireSubmissionService = __decorate([
    (0, core_1.injectable)(),
    __param(2, (0, core_1.inject)(core_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [repository_1.QuestionnairenaireSubmissionRepository,
        core_1.EventEmitter, Object])
], QuestionnairenaireSubmissionService);
exports.QuestionnairenaireSubmissionService = QuestionnairenaireSubmissionService;
//# sourceMappingURL=QuestionnairenaireSubmissionService.js.map