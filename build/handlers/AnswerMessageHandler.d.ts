import type { QuestionnaireService } from '../services';
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core';
import { AnswerMessage } from '../messages';
export declare class AnswerMessageHandler implements MessageHandler {
    private questionnaireService;
    supportedMessages: (typeof AnswerMessage)[];
    constructor(questionnaireService: QuestionnaireService);
    handle(messageContext: MessageHandlerInboundMessage<AnswerMessageHandler>): Promise<void>;
}
