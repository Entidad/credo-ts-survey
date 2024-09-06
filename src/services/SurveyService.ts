import type { SurveyStateChangedEvent } from '../SurveyEvents'
import type { AgentContext, InboundMessageContext, Query } from '@credo-ts/core'
import { CredoError, EventEmitter, inject, injectable, InjectionSymbols, Logger } from '@credo-ts/core'
import { SurveyEventTypes } from '../SurveyEvents'
import { SurveyRole } from '../SurveyRole'
import { ResponseMessage, RequestMessage } from '../messages'
import { SurveyState, SurveyModel } from '../models'
import { SurveyRepository, SurveyRecord } from '../repository'

@injectable()
export class SurveyService {
  private surveyRepository: SurveyRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    surveyRepository: SurveyRepository,
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger
  ) {
    this.surveyRepository = surveyRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }


  /**
   * Create a request message and a new Survey record for the survey role
   *
   * @param request text for request message
   * @param details optional details for request message
   * @param connectionId connection for Survey record
   * @returns request message and Survey record
   */
  public async createSurvey(
    agentContext: AgentContext,
    connectionId: string,
    config: {
      threadId:string,
      expirationDate?:string,
      request:SurveyModel
    }
  ) {
    const requestMessage = new RequestMessage({
      signatureRequired: false,
      expirationDate:config.expirationDate,      
      request: config.request
    })

    const surveyRecord = await this.createRecord({
      threadId: requestMessage.threadId,
      expirationDate:requestMessage.expirationDate,      
      connectionId: connectionId,
      role: SurveyRole.Requester,
      signatureRequired: false,
      state: SurveyState.RequestSent,
      request:requestMessage.request
    })

    await this.surveyRepository.save(agentContext, surveyRecord)
    this.eventEmitter.emit<SurveyStateChangedEvent>(agentContext, {
      type: SurveyEventTypes.SurveyStateChanged,
      payload: { previousState: null, surveyRecord },
    })
    return { requestMessage, surveyRecord }
  }

  /**
   * receive request message and create record for responder role
   *
   * @param messageContext the message context containing a respond message
   * @returns Survey record
   */
  public async processReceiveSurvey(
    messageContext: InboundMessageContext<RequestMessage>
  ): Promise<SurveyRecord> {
    const { message: requestMessage } = messageContext

    this.logger.debug(`Receiving question message with id ${requestMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const questionRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      requestMessage.id
    )
    if (questionRecord) {
      throw new CredoError(`Survey record with thread Id ${requestMessage.id} already exists.`)
    }
    const surveyRecord = await this.createRecord({
      connectionId: connection?.id,
      threadId: requestMessage.threadId,
      expirationDate: requestMessage.expirationDate,
      role: SurveyRole.Responder,
      signatureRequired: false,
      state: SurveyState.RequestReceived,
      request: requestMessage.request
    })
    await this.surveyRepository.save(messageContext.agentContext, surveyRecord)

    this.eventEmitter.emit<SurveyStateChangedEvent>(messageContext.agentContext, {
      type: SurveyEventTypes.SurveyStateChanged,
      payload: { previousState: null, surveyRecord },
    })
    return surveyRecord
  }

  /**
   * create response message, check that response is valid
   *
   * @param surveyRecord record containing request and response
   * @param response response used in response message
   * @returns answer message and Survey record
   */
  public async createResponse(agentContext: AgentContext, surveyResponseRecord: SurveyRecord, response: string) {
    console.info("createResponse:beg");
    const responseMessage = new ResponseMessage({ response: response, threadId: surveyResponseRecord.threadId })
    //surveyResponseRecord.assertState(SurveyState.RequestReceived)
    await this.updateState(agentContext, surveyResponseRecord, SurveyState.Completed);    
    surveyResponseRecord.response = response
    await this.surveyRepository.update(agentContext, surveyResponseRecord);
    console.info("createResponse:end");
    return { responseMessage, surveyResponseRecord }
  }

  /**
   * ockert
   * create update message, check that response is valid
   *
   * @param surveyRecord record containing request and response
   * @param response response used in response message
   * @returns answer message and Survey record
   */
  public async createUpdate(agentContext: AgentContext, surveyResponseRecord: SurveyRecord, response: string) {
  //console.info("createUpdate:beg");
    const responseMessage = new ResponseMessage({ response: response, threadId: surveyResponseRecord.threadId })
    //surveyResponseRecord.assertState(SurveyState.RequestReceived)
    await this.updateState(agentContext, surveyResponseRecord, surveyResponseRecord.state);    
    surveyResponseRecord.response = response
  //console.info("createUpdate:response:"+JSON.stringify(surveyResponseRecord));
    await this.surveyRepository.update(agentContext, surveyResponseRecord);
  //console.info("createUpdate:end");
    return { responseMessage, surveyResponseRecord }
  }


  /**
   * receive response as questioner
   *
   * @param messageContext the message context containing an response message
   * @returns Survey record
   */
  public async receiveResponse(messageContext: InboundMessageContext<ResponseMessage>): Promise<SurveyRecord> {
  //console.info("receiveResponse:beg");
    const { message: responseMessage } = messageContext
    this.logger.debug(`Receiving response message with id ${responseMessage.id}`)
    const connection = messageContext.assertReadyConnection()
    const surveyRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      responseMessage.threadId
    )
    if (!surveyRecord) {
      throw new CredoError(`Survey record with thread Id ${responseMessage.threadId} not found.`)
    }
  //console.info("receiveResponse:skipping assertions");
    //surveyRecord.assertState(SurveyState.RequestSent)
    //surveyRecord.assertRole(SurveyRole.Requester)
    surveyRecord.response = JSON.stringify(responseMessage.response)
    await this.updateState(messageContext.agentContext, surveyRecord, SurveyState.Completed)
  //console.info("receiveResponse:end");
    return surveyRecord
  }

  /**
   * Update the record to a new state and emit an state changed event. Also updates the record
   * in storage.
   *
   * @param surveyRecord The survey record to update the state for
   * @param newState The state to update to
   *
   */
  private async updateState(
    agentContext: AgentContext,
    surveyRecord: SurveyRecord,
    newState: SurveyState
  ) {
    const previousState = surveyRecord.state
    surveyRecord.state = newState
    await this.surveyRepository.update(agentContext, surveyRecord)
    this.eventEmitter.emit<SurveyStateChangedEvent>(agentContext, {
      type: SurveyEventTypes.SurveyStateChanged,
      payload: {
        previousState,
        surveyRecord: surveyRecord,
      },
    })
  }

  private async createRecord(options: {
    connectionId: string
    role: SurveyRole
    signatureRequired: boolean
    state: SurveyState
    threadId: string
    expirationDate?:string
    request:SurveyModel
  }): Promise<SurveyRecord> {
    const surveyMessageRecord = new SurveyRecord({
      connectionId: options.connectionId,
      threadId: options.threadId,
      role: options.role,
      signatureRequired: options.signatureRequired,
      state: options.state,      
      expirationDate:options.expirationDate,
      request:options.request
    })
    return surveyMessageRecord
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
  public getByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<SurveyRecord> {
    return this.surveyRepository.getSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a survey record by thread id
   *
   * @param connectionId The connection id
   * @param threadId The thread id
   * @returns The survey record or null if not found
   */
  public findByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<SurveyRecord | null> {
    return this.surveyRepository.findSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a survey record by id
   *
   * @param surveyId The survey record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The survey record
   *
   */
  public getById(agentContext: AgentContext, surveyId: string): Promise<SurveyRecord> {
    return this.surveyRepository.getById(agentContext, surveyId)
  }

  /**
   * Retrieve a survey record by id
   *
   * @param surveyId The survey record id
   * @return The survey record or null if not found
   *
   */
  public findById(agentContext: AgentContext, surveyId: string): Promise<SurveyRecord | null> {
    return this.surveyRepository.findById(agentContext, surveyId)
  }

  /**
   * Retrieve a all the survey records
   * 
   * @return The survey record or null if not found
   *
   */
  public getAll(agentContext: AgentContext) {
    return this.surveyRepository.getAll(agentContext)
  }

  /**
   * Retrieve a all the survey records by query 
   * 
   * @param query The query in JSON format, eg: {connectionId:21321, threadId:312312 }
   * @return The survey record or null if not found
   *
   */
  public async findAllByQuery(agentContext: AgentContext, query: Query<SurveyRecord>) {
    return this.surveyRepository.findByQuery(agentContext, query)
  }

  /**
   * Delete a survey record by id
   *
   * @param surveyId The survey record id
   * @throws {RecordNotFoundError} If no record is found
   * @return null
   *
   */
  public async deleteById(agentContext: AgentContext, surveyId: string){
    const surveyRecord = await this.getById(agentContext, surveyId)
    this.surveyRepository.delete(agentContext, surveyRecord)
    return;
  }

  /**
   * Deletes all survey records
   *
   * @return null
   *
   */
  public async deleteAll(agentContext: AgentContext){
    let surveyRecords=await this.getAll(agentContext);
    for(var i=0;i<surveyRecords.length;i++){
        try{
            let surveyRecord=surveyRecords[i];
    	    await this.surveyRepository.delete(agentContext, surveyRecord)
	}catch(e){
            console.error(e.toString());
	}
    }
    return;
  }
}
