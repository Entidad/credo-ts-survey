import type { FooBarService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { FooMessage } from '../messages'

export class FooMessageHandler implements MessageHandler {
  private fooBarService: FooBarService
  public supportedMessages = [FooMessage]

  public constructor(fooBarService: FooBarService) {
    this.fooBarService = fooBarService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<FooMessageHandler>) {
    await this.fooBarService.processReceiveFoo(messageContext)
  }
}
