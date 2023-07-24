import type { QuestionnaireService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { AnswerMessage } from '../messages'

export class AnswerMessageHandler implements MessageHandler {
  private questionnaireService: QuestionnaireService
  public supportedMessages = [AnswerMessage]

  public constructor(questionnaireService: QuestionnaireService) {
    this.questionnaireService = questionnaireService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<AnswerMessageHandler>) {
    await this.questionnaireService.receiveAnswer(messageContext)
  }
}
