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
  private fooBarService: FooBarService
  private messageSender: MessageSender
  private connectionService: ConnectionService
  private agentContext: AgentContext

  public constructor(
    fooBarService: FooBarService,
    messageSender: MessageSender,
    connectionService: ConnectionService,
    agentContext: AgentContext
  ) {
    this.fooBarService = fooBarService
    this.messageSender = messageSender
    this.connectionService = connectionService
    this.agentContext = agentContext

    this.agentContext.dependencyManager.registerMessageHandlers([
      new FooMessageHandler(this.fooBarService),
      new BarMessageHandler(this.fooBarService),
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
  public async sendFoo(
    connectionId: string,
    config: {
      foo: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const { fooMessage, fooBarRecord } = await this.fooBarService.createFoo(
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
      associatedRecord: fooBarRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return fooBarRecord
  }

  /**
   * Create an bar message as the holder and send it in response to a foo message
   *
   * @param fooRecordId the id of the fooBar record
   * @param response response included in the bar message
   * @returns FooBar record
   */
  public async sendBar(fooRecordId: string, response: string) {
    const fooRecord = await this.fooBarService.getById(this.agentContext, fooRecordId)

    const { barMessage, fooBarRecord } = await this.fooBarService.createBar(
      this.agentContext,
      fooRecord,
      response
    )

    const connection = await this.connectionService.getById(this.agentContext, fooRecord.connectionId)

    const outboundMessageContext = new OutboundMessageContext(barMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: fooBarRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return fooBarRecord
  }

  /**
   * Get all FooBar records
   *
   * @returns list containing all FooBar records
   */
  public getAll() {
    return this.fooBarService.getAll(this.agentContext)
  }

  /**
   * Get all FooBar records by specified query params
   *
   * @returns list containing all FooBar records matching specified query params
   */
  public findAllByQuery(query: Query<FooBarRecord>) {
    return this.fooBarService.findAllByQuery(this.agentContext, query)
  }

  /**
   * Retrieve a foo bar record by id
   *
   * @param fooBarId The fooBar record id
   * @return The foo bar record or null if not found
   *
   */
  public findById(fooBarId: string) {
    return this.fooBarService.findById(this.agentContext, fooBarId)
  }
}
