import { AgentMessage } from '@credo-ts/core';
export declare class RequestMessage extends AgentMessage {
    /**
     * Create new RequestMessage instance.
     * @param options
     */
    constructor(options: {
        id?: string;
        threadId: string;
        signatureRequired?: boolean;
        request: {
            jsonSchema: string;
            uiSchema: string;
            initData?: string;
            i18nData?: string;
        };
        expirationDate?: string;
    });
    readonly type: string;
    static readonly type: import("@credo-ts/core/build/utils/messageType").ParsedMessageType;
    signatureRequired?: boolean;
    expirationDate?: string;
    request: {
        jsonSchema: string;
        uiSchema: string;
        initData?: string;
        i18nData?: string;
    };
}
