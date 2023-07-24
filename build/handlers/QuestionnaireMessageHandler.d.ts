import type { QuestionnairenaireSubmissionService } from '../services';
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core';
import { QuestionnaireMessage } from '../messages';
export declare class QuestionnaireMessageHandler implements MessageHandler {
    private questionSubmissionService;
    supportedMessages: (typeof QuestionnaireMessage)[];
    constructor(questionSubmissionService: QuestionnairenaireSubmissionService);
    handle(messageContext: MessageHandlerInboundMessage<QuestionnaireMessageHandler>): Promise<void>;
}
