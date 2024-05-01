import type { QuestionnaireService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@credo-ts/core'

import { QuestionMessage } from '../messages'

export class QuestionMessageHandler implements MessageHandler {
  private questionnaireService: QuestionnaireService
  public supportedMessages = [QuestionMessage]

  public constructor(questionnaireService: QuestionnaireService) {
    this.questionnaireService = questionnaireService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<QuestionMessageHandler>) {
    await this.questionnaireService.processReceiveQuestion(messageContext)
  }
}
