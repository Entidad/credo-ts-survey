import type { FooBarRecord } from './repository'
import type { Query } from '@aries-framework/core'

import {
  AgentContext,
  ConnectionService,
  OutboundMessageContext,
  injectable,
  MessageSender,
} from '@aries-framework/core'

import { AnswerMessageHandler, QuestionMessageHandler } from './handlers'
import { ValidResponse } from './models'
import { FooBarService } from './services'

@injectable()
export class FooBarApi {
  private fooAnswerService: FooBarService
  private messageSender: MessageSender
  private connectionService: ConnectionService
  private agentContext: AgentContext

  public constructor(
    fooAnswerService: FooBarService,
    messageSender: MessageSender,
    connectionService: ConnectionService,
    agentContext: AgentContext
  ) {
    this.fooAnswerService = fooAnswerService
    this.messageSender = messageSender
    this.connectionService = connectionService
    this.agentContext = agentContext

    this.agentContext.dependencyManager.registerMessageHandlers([
      new QuestionMessageHandler(this.fooAnswerService),
      new AnswerMessageHandler(this.fooAnswerService),
    ])
  }

  /**
   * Create a foo message with possible valid responses, then send message to the
   * holder
   *
   * @param connectionId connection to send the foo message to
   * @param config config for creating foo message
   * @returns FooBar record
   */
  public async sendQuestion(
    connectionId: string,
    config: {
      foo: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const { fooMessage, fooAnswerRecord } = await this.fooAnswerService.createQuestion(
      this.agentContext,
      connectionId,
      {
        foo: config.foo,
        validResponses: config.validResponses.map((item) => new ValidResponse(item)),
        detail: config?.detail,
      }
    )
    const outboundMessageContext = new OutboundMessageContext(fooMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: fooAnswerRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return fooAnswerRecord
  }

  /**
   * Create an bar message as the holder and send it in response to a foo message
   *
   * @param fooRecordId the id of the fooAnswer record
   * @param response response included in the bar message
   * @returns FooBar record
   */
  public async sendAnswer(fooRecordId: string, response: string) {
    const fooRecord = await this.fooAnswerService.getById(this.agentContext, fooRecordId)

    const { barMessage, fooAnswerRecord } = await this.fooAnswerService.createAnswer(
      this.agentContext,
      fooRecord,
      response
    )

    const connection = await this.connectionService.getById(this.agentContext, fooRecord.connectionId)

    const outboundMessageContext = new OutboundMessageContext(barMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: fooAnswerRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return fooAnswerRecord
  }

  /**
   * Get all FooBar records
   *
   * @returns list containing all FooBar records
   */
  public getAll() {
    return this.fooAnswerService.getAll(this.agentContext)
  }

  /**
   * Get all FooBar records by specified query params
   *
   * @returns list containing all FooBar records matching specified query params
   */
  public findAllByQuery(query: Query<FooBarRecord>) {
    return this.fooAnswerService.findAllByQuery(this.agentContext, query)
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooAnswerId The fooAnswer record id
   * @return The foo bar record or null if not found
   *
   */
  public findById(fooAnswerId: string) {
    return this.fooAnswerService.findById(this.agentContext, fooAnswerId)
  }
}
