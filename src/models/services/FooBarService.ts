import type { FooBarStateChangedEvent } from '../FooBarEvents'
import type { ValidResponse } from '../models'
import type { AgentContext, InboundMessageContext, Query } from '@aries-framework/core'

import { AriesFrameworkError, EventEmitter, inject, injectable, InjectionSymbols, Logger } from '@aries-framework/core'

import { FooBarEventTypes } from '../FooBarEvents'
import { FooBarRole } from '../FooBarRole'
import { AnswerMessage, QuestionMessage } from '../messages'
import { FooBarState } from '../models'
import { FooBarRepository, FooBarRecord } from '../repository'

@injectable()
export class FooBarService {
  private fooAnswerRepository: FooBarRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    fooAnswerRepository: FooBarRepository,
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger
  ) {
    this.fooAnswerRepository = fooAnswerRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }
  /**
   * Create a foo message and a new FooBar record for the fooer role
   *
   * @param foo text for foo message
   * @param details optional details for foo message
   * @param connectionId connection for FooBar record
   * @param validResponses array of valid responses for foo
   * @returns foo message and FooBar record
   */
  public async createQuestion(
    agentContext: AgentContext,
    connectionId: string,
    config: {
      foo: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const fooMessage = new QuestionMessage({
      fooText: config.foo,
      fooDetail: config?.detail,
      signatureRequired: false,
      validResponses: config.validResponses,
    })

    const fooAnswerRecord = await this.createRecord({
      fooText: fooMessage.fooText,
      fooDetail: fooMessage.fooDetail,
      threadId: fooMessage.threadId,
      connectionId: connectionId,
      role: FooBarRole.Questioner,
      signatureRequired: false,
      state: FooBarState.QuestionSent,
      validResponses: fooMessage.validResponses,
    })

    await this.fooAnswerRepository.save(agentContext, fooAnswerRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: { previousState: null, fooAnswerRecord },
    })

    return { fooMessage, fooAnswerRecord }
  }

  /**
   * receive foo message and create record for responder role
   *
   * @param messageContext the message context containing a foo message
   * @returns FooBar record
   */
  public async processReceiveQuestion(
    messageContext: InboundMessageContext<QuestionMessage>
  ): Promise<FooBarRecord> {
    const { message: fooMessage } = messageContext

    this.logger.debug(`Receiving foo message with id ${fooMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const fooRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      fooMessage.id
    )
    if (fooRecord) {
      throw new AriesFrameworkError(`Question bar record with thread Id ${fooMessage.id} already exists.`)
    }
    const fooAnswerRecord = await this.createRecord({
      fooText: fooMessage.fooText,
      fooDetail: fooMessage.fooDetail,
      connectionId: connection?.id,
      threadId: fooMessage.threadId,
      role: FooBarRole.Responder,
      signatureRequired: false,
      state: FooBarState.QuestionReceived,
      validResponses: fooMessage.validResponses,
    })

    await this.fooAnswerRepository.save(messageContext.agentContext, fooAnswerRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(messageContext.agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: { previousState: null, fooAnswerRecord },
    })

    return fooAnswerRecord
  }

  /**
   * create bar message, check that response is valid
   *
   * @param fooAnswerRecord record containing foo and valid responses
   * @param response response used in bar message
   * @returns bar message and FooBar record
   */
  public async createAnswer(agentContext: AgentContext, fooAnswerRecord: FooBarRecord, response: string) {
    const barMessage = new AnswerMessage({ response: response, threadId: fooAnswerRecord.threadId })

    fooAnswerRecord.assertState(FooBarState.QuestionReceived)

    fooAnswerRecord.response = response

    if (fooAnswerRecord.validResponses.some((e) => e.text === response)) {
      await this.updateState(agentContext, fooAnswerRecord, FooBarState.AnswerSent)
    } else {
      throw new AriesFrameworkError(`Response does not match valid responses`)
    }
    return { barMessage, fooAnswerRecord }
  }

  /**
   * receive bar as fooer
   *
   * @param messageContext the message context containing an bar message message
   * @returns FooBar record
   */
  public async receiveAnswer(messageContext: InboundMessageContext<AnswerMessage>): Promise<FooBarRecord> {
    const { message: barMessage } = messageContext

    this.logger.debug(`Receiving bar message with id ${barMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const fooAnswerRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      barMessage.threadId
    )
    if (!fooAnswerRecord) {
      throw new AriesFrameworkError(`Question Answer record with thread Id ${barMessage.threadId} not found.`)
    }
    fooAnswerRecord.assertState(FooBarState.QuestionSent)
    fooAnswerRecord.assertRole(FooBarRole.Questioner)

    fooAnswerRecord.response = barMessage.response

    await this.updateState(messageContext.agentContext, fooAnswerRecord, FooBarState.AnswerReceived)

    return fooAnswerRecord
  }

  /**
   * Update the record to a new state and emit an state changed event. Also updates the record
   * in storage.
   *
   * @param fooAnswerRecord The foo bar record to update the state for
   * @param newState The state to update to
   *
   */
  private async updateState(
    agentContext: AgentContext,
    fooAnswerRecord: FooBarRecord,
    newState: FooBarState
  ) {
    const previousState = fooAnswerRecord.state
    fooAnswerRecord.state = newState
    await this.fooAnswerRepository.update(agentContext, fooAnswerRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: {
        previousState,
        fooAnswerRecord: fooAnswerRecord,
      },
    })
  }

  private async createRecord(options: {
    fooText: string
    fooDetail?: string
    connectionId: string
    role: FooBarRole
    signatureRequired: boolean
    state: FooBarState
    threadId: string
    validResponses: ValidResponse[]
  }): Promise<FooBarRecord> {
    const fooMessageRecord = new FooBarRecord({
      fooText: options.fooText,
      fooDetail: options.fooDetail,
      connectionId: options.connectionId,
      threadId: options.threadId,
      role: options.role,
      signatureRequired: options.signatureRequired,
      state: options.state,
      validResponses: options.validResponses,
    })

    return fooMessageRecord
  }

  /**
   * Retrieve a foo bar record by connection id and thread id
   *
   * @param connectionId The connection id
   * @param threadId The thread id
   * @throws {RecordNotFoundError} If no record is found
   * @throws {RecordDuplicateError} If multiple records are found
   * @returns The foo bar record
   */
  public getByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<FooBarRecord> {
    return this.fooAnswerRepository.getSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a foo bar record by thread id
   *
   * @param connectionId The connection id
   * @param threadId The thread id
   * @returns The foo bar record or null if not found
   */
  public findByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<FooBarRecord | null> {
    return this.fooAnswerRepository.findSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooAnswerId The fooAnswer record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The foo bar record
   *
   */
  public getById(agentContext: AgentContext, fooAnswerId: string): Promise<FooBarRecord> {
    return this.fooAnswerRepository.getById(agentContext, fooAnswerId)
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooAnswerId The fooAnswer record id
   * @return The foo bar record or null if not found
   *
   */
  public findById(agentContext: AgentContext, fooAnswerId: string): Promise<FooBarRecord | null> {
    return this.fooAnswerRepository.findById(agentContext, fooAnswerId)
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooAnswerId The fooAnswer record id
   * @return The foo bar record or null if not found
   *
   */
  public getAll(agentContext: AgentContext) {
    return this.fooAnswerRepository.getAll(agentContext)
  }

  public async findAllByQuery(agentContext: AgentContext, query: Query<FooBarRecord>) {
    return this.fooAnswerRepository.findByQuery(agentContext, query)
  }
}
