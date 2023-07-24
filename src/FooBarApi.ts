import type { FooBarRecord } from './repository'
import type { Query } from '@aries-framework/core'

import {
  AgentContext,
  ConnectionService,
  OutboundMessageContext,
  injectable,
  MessageSender,
} from '@aries-framework/core'

import { BarMessageHandler, FooMessageHandler } from './handlers'
import { ValidResponse } from './models'
import { FooBarService } from './services'

@injectable()
export class FooBarApi {
  private questionBarService: FooBarService
  private messageSender: MessageSender
  private connectionService: ConnectionService
  private agentContext: AgentContext

  public constructor(
    questionBarService: FooBarService,
    messageSender: MessageSender,
    connectionService: ConnectionService,
    agentContext: AgentContext
  ) {
    this.questionBarService = questionBarService
    this.messageSender = messageSender
    this.connectionService = connectionService
    this.agentContext = agentContext

    this.agentContext.dependencyManager.registerMessageHandlers([
      new FooMessageHandler(this.questionBarService),
      new BarMessageHandler(this.questionBarService),
    ])
  }

  /**
   * Create a question message with possible valid responses, then send message to the
   * holder
   *
   * @param connectionId connection to send the question message to
   * @param config config for creating question message
   * @returns FooBar record
   */
  public async sendFoo(
    connectionId: string,
    config: {
      question: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const { questionMessage, questionBarRecord } = await this.questionBarService.createFoo(
      this.agentContext,
      connectionId,
      {
        question: config.question,
        validResponses: config.validResponses.map((item) => new ValidResponse(item)),
        detail: config?.detail,
      }
    )
    const outboundMessageContext = new OutboundMessageContext(questionMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: questionBarRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return questionBarRecord
  }

  /**
   * Create an answer message as the holder and send it in response to a question message
   *
   * @param questionRecordId the id of the questionBar record
   * @param response response included in the answer message
   * @returns FooBar record
   */
  public async sendBar(questionRecordId: string, response: string) {
    const questionRecord = await this.questionBarService.getById(this.agentContext, questionRecordId)

    const { answerMessage, questionBarRecord } = await this.questionBarService.createBar(
      this.agentContext,
      questionRecord,
      response
    )

    const connection = await this.connectionService.getById(this.agentContext, questionRecord.connectionId)

    const outboundMessageContext = new OutboundMessageContext(answerMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: questionBarRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return questionBarRecord
  }

  /**
   * Get all FooBar records
   *
   * @returns list containing all FooBar records
   */
  public getAll() {
    return this.questionBarService.getAll(this.agentContext)
  }

  /**
   * Get all FooBar records by specified query params
   *
   * @returns list containing all FooBar records matching specified query params
   */
  public findAllByQuery(query: Query<FooBarRecord>) {
    return this.questionBarService.findAllByQuery(this.agentContext, query)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionBarId The questionBar record id
   * @return The question answer record or null if not found
   *
   */
  public findById(questionBarId: string) {
    return this.questionBarService.findById(this.agentContext, questionBarId)
  }
}
