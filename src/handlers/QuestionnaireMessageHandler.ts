import type { QuestionnairenaireSubmissionService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { QuestionnaireMessage } from '../messages'

export class QuestionnaireMessageHandler implements MessageHandler {
  private questionSubmissionService: QuestionnairenaireSubmissionService
  public supportedMessages = [QuestionnaireMessage]

  public constructor(questionSubmissionService: QuestionnairenaireSubmissionService) {
    this.questionSubmissionService = questionSubmissionService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<QuestionnaireMessageHandler>) {
    await this.questionSubmissionService.processReceiveQuestionnaire(messageContext)
  }
}
