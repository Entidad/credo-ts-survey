import type { FooBarService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { AnswerMessage } from '../messages'

export class AnswerMessageHandler implements MessageHandler {
  private fooAnswerService: FooBarService
  public supportedMessages = [AnswerMessage]

  public constructor(fooAnswerService: FooBarService) {
    this.fooAnswerService = fooAnswerService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<AnswerMessageHandler>) {
    await this.fooAnswerService.receiveAnswer(messageContext)
  }
}
