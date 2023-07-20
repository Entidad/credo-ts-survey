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
  private fooBarRepository: FooBarRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    fooBarRepository: FooBarRepository,
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger
  ) {
    this.fooBarRepository = fooBarRepository
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
  public async createFoo(
    agentContext: AgentContext,
    connectionId: string,
    config: {
      foo: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const fooMessage = new FooMessage({
      fooText: config.foo,
      fooDetail: config?.detail,
      signatureRequired: false,
      validResponses: config.validResponses,
    })

    const fooBarRecord = await this.createRecord({
      fooText: fooMessage.fooText,
      fooDetail: fooMessage.fooDetail,
      threadId: fooMessage.threadId,
      connectionId: connectionId,
      role: FooBarRole.Fooer,
      signatureRequired: false,
      state: FooBarState.FooSent,
      validResponses: fooMessage.validResponses,
    })

    await this.fooBarRepository.save(agentContext, fooBarRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: { previousState: null, fooBarRecord },
    })

    return { fooMessage, fooBarRecord }
  }

  /**
   * receive foo message and create record for responder role
   *
   * @param messageContext the message context containing a foo message
   * @returns FooBar record
   */
  public async processReceiveFoo(
    messageContext: InboundMessageContext<FooMessage>
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
      throw new AriesFrameworkError(`Foo bar record with thread Id ${fooMessage.id} already exists.`)
    }
    const fooBarRecord = await this.createRecord({
      fooText: fooMessage.fooText,
      fooDetail: fooMessage.fooDetail,
      connectionId: connection?.id,
      threadId: fooMessage.threadId,
      role: FooBarRole.Responder,
      signatureRequired: false,
      state: FooBarState.FooReceived,
      validResponses: fooMessage.validResponses,
    })

    await this.fooBarRepository.save(messageContext.agentContext, fooBarRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(messageContext.agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: { previousState: null, fooBarRecord },
    })

    return fooBarRecord
  }

  /**
   * create bar message, check that response is valid
   *
   * @param fooBarRecord record containing foo and valid responses
   * @param response response used in bar message
   * @returns bar message and FooBar record
   */
  public async createBar(agentContext: AgentContext, fooBarRecord: FooBarRecord, response: string) {
    const barMessage = new BarMessage({ response: response, threadId: fooBarRecord.threadId })

    fooBarRecord.assertState(FooBarState.FooReceived)

    fooBarRecord.response = response

    if (fooBarRecord.validResponses.some((e) => e.text === response)) {
      await this.updateState(agentContext, fooBarRecord, FooBarState.BarSent)
    } else {
      throw new AriesFrameworkError(`Response does not match valid responses`)
    }
    return { barMessage, fooBarRecord }
  }

  /**
   * receive bar as fooer
   *
   * @param messageContext the message context containing an bar message message
   * @returns FooBar record
   */
  public async receiveBar(messageContext: InboundMessageContext<BarMessage>): Promise<FooBarRecord> {
    const { message: barMessage } = messageContext

    this.logger.debug(`Receiving bar message with id ${barMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const fooBarRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      barMessage.threadId
    )
    if (!fooBarRecord) {
      throw new AriesFrameworkError(`Foo Bar record with thread Id ${barMessage.threadId} not found.`)
    }
    fooBarRecord.assertState(FooBarState.FooSent)
    fooBarRecord.assertRole(FooBarRole.Fooer)

    fooBarRecord.response = barMessage.response

    await this.updateState(messageContext.agentContext, fooBarRecord, FooBarState.BarReceived)

    return fooBarRecord
  }

  /**
   * Update the record to a new state and emit an state changed event. Also updates the record
   * in storage.
   *
   * @param fooBarRecord The foo bar record to update the state for
   * @param newState The state to update to
   *
   */
  private async updateState(
    agentContext: AgentContext,
    fooBarRecord: FooBarRecord,
    newState: FooBarState
  ) {
    const previousState = fooBarRecord.state
    fooBarRecord.state = newState
    await this.fooBarRepository.update(agentContext, fooBarRecord)

    this.eventEmitter.emit<FooBarStateChangedEvent>(agentContext, {
      type: FooBarEventTypes.FooBarStateChanged,
      payload: {
        previousState,
        fooBarRecord: fooBarRecord,
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
    return this.fooBarRepository.getSingleByQuery(agentContext, {
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
    return this.fooBarRepository.findSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooBarId The fooBar record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The foo bar record
   *
   */
  public getById(agentContext: AgentContext, fooBarId: string): Promise<FooBarRecord> {
    return this.fooBarRepository.getById(agentContext, fooBarId)
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooBarId The fooBar record id
   * @return The foo bar record or null if not found
   *
   */
  public findById(agentContext: AgentContext, fooBarId: string): Promise<FooBarRecord | null> {
    return this.fooBarRepository.findById(agentContext, fooBarId)
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooBarId The fooBar record id
   * @return The foo bar record or null if not found
   *
   */
  public getAll(agentContext: AgentContext) {
    return this.fooBarRepository.getAll(agentContext)
  }

  public async findAllByQuery(agentContext: AgentContext, query: Query<FooBarRecord>) {
    return this.fooBarRepository.findByQuery(agentContext, query)
  }
}
