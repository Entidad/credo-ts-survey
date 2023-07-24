import type { QuestionnairenaireSubmissionService } from '../services'
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core'

import { SubmissionMessage } from '../messages'

export class SubmissionMessageHandler implements MessageHandler {
  private questionSubmissionService: QuestionnairenaireSubmissionService
  public supportedMessages = [SubmissionMessage]

  public constructor(questionSubmissionService: QuestionnairenaireSubmissionService) {
    this.questionSubmissionService = questionSubmissionService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<SubmissionMessageHandler>) {
    await this.questionSubmissionService.receiveSubmission(messageContext)
  }
}
