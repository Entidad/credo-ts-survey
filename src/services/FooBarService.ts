import type { FooBarStateChangedEvent } from '../FooBarEvents'
import type { ValidResponse } from '../models'
import type { AgentContext, InboundMessageContext, Query } from '@aries-framework/core'

import { AriesFrameworkError, EventEmitter, inject, injectable, InjectionSymbols, Logger } from '@aries-framework/core'

import { FooBarEventTypes } from '../FooBarEvents'
import { FooBarRole } from '../FooBarRole'
import { BarMessage, FooMessage } from '../messages'
import { FooBarState } from '../models'
import { FooBarRepository, FooBarRecord } from '../repository'

@injectable()
export class FooBarService {
  private questionBarRepository: FooBarRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    questionBarRepository: FooBarRepository,
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger
  ) {
    this.questionBarRepository = questionBarRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }
  /**
   * Create a question message and a new FooBar record for the questioner role
   *
   * @param question text for question message
   * @param details optional details for question message
   * @param connectionId connection for FooBar record
   * @param validResponses array of valid responses for question
   * @returns question message and FooBar record
   */
  public async createFoo(
    agentContext: AgentContext,
    connectionId: string,
    config: {
      question: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const questionMessage = new FooMessage({
      questionText: config.question,
      questionDetail: config?.detail,
      signatureRequired: false,
      validResponses: config.validResponses,
    })

    const questionBarRecord = await this.createRecord({
      questionText: questionMessage.questionText,
      questionDetail: questionMessage.questionDetail,
      threadId: questionMessage.threadId,
      connectionId: connectionId,
      role: FooBarRole.Fooer,
      signatureRequired: false,
      state: FooBarState.FooSent,
      validResponses: questionMessage.validResponses,
    })

    await this.questionBarRepository.save(agentContext, questionBarRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: { previousState: null, questionBarRecord },
    })

    return { questionMessage, questionBarRecord }
  }

  /**
   * receive question message and create record for responder role
   *
   * @param messageContext the message context containing a question message
   * @returns FooBar record
   */
  public async processReceiveFoo(
    messageContext: InboundMessageContext<FooMessage>
  ): Promise<FooBarRecord> {
    const { message: questionMessage } = messageContext

    this.logger.debug(`Receiving question message with id ${questionMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const questionRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      questionMessage.id
    )
    if (questionRecord) {
      throw new AriesFrameworkError(`Foo answer record with thread Id ${questionMessage.id} already exists.`)
    }
    const questionBarRecord = await this.createRecord({
      questionText: questionMessage.questionText,
      questionDetail: questionMessage.questionDetail,
      connectionId: connection?.id,
      threadId: questionMessage.threadId,
      role: FooBarRole.Responder,
      signatureRequired: false,
      state: FooBarState.FooReceived,
      validResponses: questionMessage.validResponses,
    })

    await this.questionBarRepository.save(messageContext.agentContext, questionBarRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(messageContext.agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: { previousState: null, questionBarRecord },
    })

    return questionBarRecord
  }

  /**
   * create answer message, check that response is valid
   *
   * @param questionBarRecord record containing question and valid responses
   * @param response response used in answer message
   * @returns answer message and FooBar record
   */
  public async createBar(agentContext: AgentContext, questionBarRecord: FooBarRecord, response: string) {
    const answerMessage = new BarMessage({ response: response, threadId: questionBarRecord.threadId })

    questionBarRecord.assertState(FooBarState.FooReceived)

    questionBarRecord.response = response

    if (questionBarRecord.validResponses.some((e) => e.text === response)) {
      await this.updateState(agentContext, questionBarRecord, FooBarState.BarSent)
    } else {
      throw new AriesFrameworkError(`Response does not match valid responses`)
    }
    return { answerMessage, questionBarRecord }
  }

  /**
   * receive answer as questioner
   *
   * @param messageContext the message context containing an answer message message
   * @returns FooBar record
   */
  public async receiveBar(messageContext: InboundMessageContext<BarMessage>): Promise<FooBarRecord> {
    const { message: answerMessage } = messageContext

    this.logger.debug(`Receiving answer message with id ${answerMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const questionBarRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      answerMessage.threadId
    )
    if (!questionBarRecord) {
      throw new AriesFrameworkError(`Foo Bar record with thread Id ${answerMessage.threadId} not found.`)
    }
    questionBarRecord.assertState(FooBarState.FooSent)
    questionBarRecord.assertRole(FooBarRole.Fooer)

    questionBarRecord.response = answerMessage.response

    await this.updateState(messageContext.agentContext, questionBarRecord, FooBarState.BarReceived)

    return questionBarRecord
  }

  /**
   * Update the record to a new state and emit an state changed event. Also updates the record
   * in storage.
   *
   * @param questionBarRecord The question answer record to update the state for
   * @param newState The state to update to
   *
   */
  private async updateState(
    agentContext: AgentContext,
    questionBarRecord: FooBarRecord,
    newState: FooBarState
  ) {
    const previousState = questionBarRecord.state
    questionBarRecord.state = newState
    await this.questionBarRepository.update(agentContext, questionBarRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: {
        previousState,
        questionBarRecord: questionBarRecord,
      },
    })
  }

  private async createRecord(options: {
    questionText: string
    questionDetail?: string
    connectionId: string
    role: FooBarRole
    signatureRequired: boolean
    state: FooBarState
    threadId: string
    validResponses: ValidResponse[]
  }): Promise<FooBarRecord> {
    const questionMessageRecord = new FooBarRecord({
      questionText: options.questionText,
      questionDetail: options.questionDetail,
      connectionId: options.connectionId,
      threadId: options.threadId,
      role: options.role,
      signatureRequired: options.signatureRequired,
      state: options.state,
      validResponses: options.validResponses,
    })

    return questionMessageRecord
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
  public getByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<FooBarRecord> {
    return this.questionBarRepository.getSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a question answer record by thread id
   *
   * @param connectionId The connection id
   * @param threadId The thread id
   * @returns The question answer record or null if not found
   */
  public findByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<FooBarRecord | null> {
    return this.questionBarRepository.findSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionBarId The questionBar record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The question answer record
   *
   */
  public getById(agentContext: AgentContext, questionBarId: string): Promise<FooBarRecord> {
    return this.questionBarRepository.getById(agentContext, questionBarId)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionBarId The questionBar record id
   * @return The question answer record or null if not found
   *
   */
  public findById(agentContext: AgentContext, questionBarId: string): Promise<FooBarRecord | null> {
    return this.questionBarRepository.findById(agentContext, questionBarId)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionBarId The questionBar record id
   * @return The question answer record or null if not found
   *
   */
  public getAll(agentContext: AgentContext) {
    return this.questionBarRepository.getAll(agentContext)
  }

  public async findAllByQuery(agentContext: AgentContext, query: Query<FooBarRecord>) {
    return this.questionBarRepository.findByQuery(agentContext, query)
  }
}
