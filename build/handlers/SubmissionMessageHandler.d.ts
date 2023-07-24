import type { QuestionnairenaireSubmissionService } from '../services';
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core';
import { SubmissionMessage } from '../messages';
export declare class SubmissionMessageHandler implements MessageHandler {
    private questionSubmissionService;
    supportedMessages: (typeof SubmissionMessage)[];
    constructor(questionSubmissionService: QuestionnairenaireSubmissionService);
    handle(messageContext: MessageHandlerInboundMessage<SubmissionMessageHandler>): Promise<void>;
}
