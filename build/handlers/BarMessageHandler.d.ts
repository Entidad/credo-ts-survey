import type { FooBarService } from '../services';
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core';
import { BarMessage } from '../messages';
export declare class BarMessageHandler implements MessageHandler {
    private questionBarService;
    supportedMessages: (typeof BarMessage)[];
    constructor(questionBarService: FooBarService);
    handle(messageContext: MessageHandlerInboundMessage<BarMessageHandler>): Promise<void>;
}
