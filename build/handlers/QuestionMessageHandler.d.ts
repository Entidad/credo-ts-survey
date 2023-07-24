import type { QuestionnaireService } from '../services';
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core';
import { QuestionMessage } from '../messages';
export declare class QuestionMessageHandler implements MessageHandler {
    private questionnaireService;
    supportedMessages: (typeof QuestionMessage)[];
    constructor(questionnaireService: QuestionnaireService);
    handle(messageContext: MessageHandlerInboundMessage<QuestionMessageHandler>): Promise<void>;
}
