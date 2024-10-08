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
exports.SurveyService = void 0;
const core_1 = require("@credo-ts/core");
const SurveyEvents_1 = require("../SurveyEvents");
const SurveyRole_1 = require("../SurveyRole");
const messages_1 = require("../messages");
const models_1 = require("../models");
const repository_1 = require("../repository");
let SurveyService = class SurveyService {
    constructor(surveyRepository, eventEmitter, logger) {
        this.surveyRepository = surveyRepository;
        this.eventEmitter = eventEmitter;
        this.logger = logger;
    }
    /**
     * Create a request message and a new Survey record for the survey role
     *
     * @param request text for request message
     * @param details optional details for request message
     * @param connectionId connection for Survey record
     * @returns request message and Survey record
     */
    async createSurvey(agentContext, connectionId, config) {
        const requestMessage = new messages_1.RequestMessage({
            signatureRequired: false,
            expirationDate: config.expirationDate,
            request: config.request
        });
        const surveyRecord = await this.createRecord({
            threadId: requestMessage.threadId,
            expirationDate: requestMessage.expirationDate,
            connectionId: connectionId,
            role: SurveyRole_1.SurveyRole.Requester,
            signatureRequired: false,
            state: models_1.SurveyState.RequestSent,
            request: requestMessage.request
        });
        await this.surveyRepository.save(agentContext, surveyRecord);
        this.eventEmitter.emit(agentContext, {
            type: SurveyEvents_1.SurveyEventTypes.SurveyStateChanged,
            payload: { previousState: null, surveyRecord },
        });
        return { requestMessage, surveyRecord };
    }
    /**
     * receive request message and create record for responder role
     *
     * @param messageContext the message context containing a respond message
     * @returns Survey record
     */
    async processReceiveSurvey(messageContext) {
        const { message: requestMessage } = messageContext;
        this.logger.debug(`Receiving question message with id ${requestMessage.id}`);
        const connection = messageContext.assertReadyConnection();
        const questionRecord = await this.findByThreadAndConnectionId(messageContext.agentContext, connection.id, requestMessage.id);
        if (questionRecord) {
            throw new core_1.CredoError(`Survey record with thread Id ${requestMessage.id} already exists.`);
        }
        const surveyRecord = await this.createRecord({
            connectionId: connection === null || connection === void 0 ? void 0 : connection.id,
            threadId: requestMessage.threadId,
            expirationDate: requestMessage.expirationDate,
            role: SurveyRole_1.SurveyRole.Responder,
            signatureRequired: false,
            state: models_1.SurveyState.RequestReceived,
            request: requestMessage.request
        });
        await this.surveyRepository.save(messageContext.agentContext, surveyRecord);
        this.eventEmitter.emit(messageContext.agentContext, {
            type: SurveyEvents_1.SurveyEventTypes.SurveyStateChanged,
            payload: { previousState: null, surveyRecord },
        });
        return surveyRecord;
    }
    /**
     * create response message, check that response is valid
     *
     * @param surveyRecord record containing request and response
     * @param response response used in response message
     * @returns answer message and Survey record
     */
    async createResponse(agentContext, surveyResponseRecord, response) {
        console.info("createResponse:beg");
        const responseMessage = new messages_1.ResponseMessage({ response: response, threadId: surveyResponseRecord.threadId });
        //surveyResponseRecord.assertState(SurveyState.RequestReceived)
        await this.updateState(agentContext, surveyResponseRecord, models_1.SurveyState.Completed);
        surveyResponseRecord.response = response;
        await this.surveyRepository.update(agentContext, surveyResponseRecord);
        console.info("createResponse:end");
        return { responseMessage, surveyResponseRecord };
    }
    /**
     * ockert
     * create update message, check that response is valid
     *
     * @param surveyRecord record containing request and response
     * @param response response used in response message
     * @returns answer message and Survey record
     */
    async createUpdate(agentContext, surveyResponseRecord, response) {
        //console.info("createUpdate:beg");
        const responseMessage = new messages_1.ResponseMessage({ response: response, threadId: surveyResponseRecord.threadId });
        //surveyResponseRecord.assertState(SurveyState.RequestReceived)
        await this.updateState(agentContext, surveyResponseRecord, surveyResponseRecord.state);
        surveyResponseRecord.response = response;
        //console.info("createUpdate:response:"+JSON.stringify(surveyResponseRecord));
        await this.surveyRepository.update(agentContext, surveyResponseRecord);
        //console.info("createUpdate:end");
        return { responseMessage, surveyResponseRecord };
    }
    /**
     * receive response as questioner
     *
     * @param messageContext the message context containing an response message
     * @returns Survey record
     */
    async receiveResponse(messageContext) {
        //console.info("receiveResponse:beg");
        const { message: responseMessage } = messageContext;
        this.logger.debug(`Receiving response message with id ${responseMessage.id}`);
        const connection = messageContext.assertReadyConnection();
        const surveyRecord = await this.findByThreadAndConnectionId(messageContext.agentContext, connection.id, responseMessage.threadId);
        if (!surveyRecord) {
            throw new core_1.CredoError(`Survey record with thread Id ${responseMessage.threadId} not found.`);
        }
        //console.info("receiveResponse:skipping assertions");
        //surveyRecord.assertState(SurveyState.RequestSent)
        //surveyRecord.assertRole(SurveyRole.Requester)
        surveyRecord.response = JSON.stringify(responseMessage.response);
        await this.updateState(messageContext.agentContext, surveyRecord, models_1.SurveyState.Completed);
        //console.info("receiveResponse:end");
        return surveyRecord;
    }
    /**
     * Update the record to a new state and emit an state changed event. Also updates the record
     * in storage.
     *
     * @param surveyRecord The survey record to update the state for
     * @param newState The state to update to
     *
     */
    async updateState(agentContext, surveyRecord, newState) {
        const previousState = surveyRecord.state;
        surveyRecord.state = newState;
        await this.surveyRepository.update(agentContext, surveyRecord);
        this.eventEmitter.emit(agentContext, {
            type: SurveyEvents_1.SurveyEventTypes.SurveyStateChanged,
            payload: {
                previousState,
                surveyRecord: surveyRecord,
            },
        });
    }
    async createRecord(options) {
        const surveyMessageRecord = new repository_1.SurveyRecord({
            connectionId: options.connectionId,
            threadId: options.threadId,
            role: options.role,
            signatureRequired: options.signatureRequired,
            state: options.state,
            expirationDate: options.expirationDate,
            request: options.request
        });
        return surveyMessageRecord;
    }
    /**
     * Retrieve a survey record by connection id and thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @throws {RecordNotFoundError} If no record is found
     * @throws {RecordDuplicateError} If multiple records are found
     * @returns The survey record
     */
    getByThreadAndConnectionId(agentContext, connectionId, threadId) {
        return this.surveyRepository.getSingleByQuery(agentContext, {
            connectionId,
            threadId,
        });
    }
    /**
     * Retrieve a survey record by thread id
     *
     * @param connectionId The connection id
     * @param threadId The thread id
     * @returns The survey record or null if not found
     */
    findByThreadAndConnectionId(agentContext, connectionId, threadId) {
        return this.surveyRepository.findSingleByQuery(agentContext, {
            connectionId,
            threadId,
        });
    }
    /**
     * Retrieve a survey record by id
     *
     * @param surveyId The survey record id
     * @throws {RecordNotFoundError} If no record is found
     * @return The survey record
     *
     */
    getById(agentContext, surveyId) {
        return this.surveyRepository.getById(agentContext, surveyId);
    }
    /**
     * Retrieve a survey record by id
     *
     * @param surveyId The survey record id
     * @return The survey record or null if not found
     *
     */
    findById(agentContext, surveyId) {
        return this.surveyRepository.findById(agentContext, surveyId);
    }
    /**
     * Retrieve a all the survey records
     *
     * @return The survey record or null if not found
     *
     */
    getAll(agentContext) {
        return this.surveyRepository.getAll(agentContext);
    }
    /**
     * Retrieve a all the survey records by query
     *
     * @param query The query in JSON format, eg: {connectionId:21321, threadId:312312 }
     * @return The survey record or null if not found
     *
     */
    async findAllByQuery(agentContext, query) {
        return this.surveyRepository.findByQuery(agentContext, query);
    }
    /**
     * Delete a survey record by id
     *
     * @param surveyId The survey record id
     * @throws {RecordNotFoundError} If no record is found
     * @return null
     *
     */
    async deleteById(agentContext, surveyId) {
        const surveyRecord = await this.getById(agentContext, surveyId);
        this.surveyRepository.delete(agentContext, surveyRecord);
        return;
    }
    /**
     * Deletes all survey records
     *
     * @return null
     *
     */
    async deleteAll(agentContext) {
        let surveyRecords = await this.getAll(agentContext);
        for (var i = 0; i < surveyRecords.length; i++) {
            try {
                let surveyRecord = surveyRecords[i];
                await this.surveyRepository.delete(agentContext, surveyRecord);
            }
            catch (e) {
                console.error(e.toString());
            }
        }
        return;
    }
};
SurveyService = __decorate([
    (0, core_1.injectable)(),
    __param(2, (0, core_1.inject)(core_1.InjectionSymbols.Logger)),
    __metadata("design:paramtypes", [repository_1.SurveyRepository,
        core_1.EventEmitter, Object])
], SurveyService);
exports.SurveyService = SurveyService;
//# sourceMappingURL=SurveyService.js.map