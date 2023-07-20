import type { FooBarService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { QuestionMessage } from '../messages'

export class QuestionMessageHandler implements MessageHandler {
  private fooAnswerService: FooBarService
  public supportedMessages = [QuestionMessage]

  public constructor(fooAnswerService: FooBarService) {
    this.fooAnswerService = fooAnswerService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<QuestionMessageHandler>) {
    await this.fooAnswerService.processReceiveQuestion(messageContext)
  }
}
