import type { FooBarService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { FooMessage } from '../messages'

export class FooMessageHandler implements MessageHandler {
  private questionBarService: FooBarService
  public supportedMessages = [FooMessage]

  public constructor(questionBarService: FooBarService) {
    this.questionBarService = questionBarService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<FooMessageHandler>) {
    await this.questionBarService.processReceiveFoo(messageContext)
  }
}
