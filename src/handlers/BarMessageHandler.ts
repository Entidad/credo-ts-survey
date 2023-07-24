import type { FooBarService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { BarMessage } from '../messages'

export class BarMessageHandler implements MessageHandler {
  private questionBarService: FooBarService
  public supportedMessages = [BarMessage]

  public constructor(questionBarService: FooBarService) {
    this.questionBarService = questionBarService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<BarMessageHandler>) {
    await this.questionBarService.receiveBar(messageContext)
  }
}
