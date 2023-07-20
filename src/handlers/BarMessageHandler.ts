import type { FooBarService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { BarMessage } from '../messages'

export class BarMessageHandler implements MessageHandler {
  private fooBarService: FooBarService
  public supportedMessages = [BarMessage]

  public constructor(fooBarService: FooBarService) {
    this.fooBarService = fooBarService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<BarMessageHandler>) {
    await this.fooBarService.receiveBar(messageContext)
  }
}
