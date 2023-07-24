import type { FooBarService } from '../services';
import type { MessageHandler, MessageHandlerInboundMessage } from '@aries-framework/core';
import { FooMessage } from '../messages';
export declare class FooMessageHandler implements MessageHandler {
    private questionBarService;
    supportedMessages: (typeof FooMessage)[];
    constructor(questionBarService: FooBarService);
    handle(messageContext: MessageHandlerInboundMessage<FooMessageHandler>): Promise<void>;
}
