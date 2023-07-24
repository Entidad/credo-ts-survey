import type { FooBarRole } from '../FooBarRole';
import type { FooBarState, ValidResponse } from '../models';
import type { RecordTags, TagsBase } from '@aries-framework/core';
import { BaseRecord } from '@aries-framework/core';
export type CustomFooBarTags = TagsBase;
export type DefaultFooBarTags = {
    connectionId: string;
    role: FooBarRole;
    state: FooBarState;
    threadId: string;
};
export type FooBarTags = RecordTags<FooBarRecord>;
export interface FooBarStorageProps {
    id?: string;
    createdAt?: Date;
    connectionId: string;
    role: FooBarRole;
    signatureRequired: boolean;
    state: FooBarState;
    tags?: CustomFooBarTags;
    threadId: string;
    questionText: string;
    questionDetail?: string;
    validResponses: ValidResponse[];
    response?: string;
}
export declare class FooBarRecord extends BaseRecord<DefaultFooBarTags, CustomFooBarTags> {
    questionText: string;
    questionDetail?: string;
    validResponses: ValidResponse[];
    connectionId: string;
    role: FooBarRole;
    signatureRequired: boolean;
    state: FooBarState;
    threadId: string;
    response?: string;
    static readonly type = "FooBarRecord";
    readonly type = "FooBarRecord";
    constructor(props: FooBarStorageProps);
    getTags(): {
        connectionId: string;
        role: FooBarRole;
        state: FooBarState;
        threadId: string;
    };
    assertRole(expectedRole: FooBarRole): void;
    assertState(expectedStates: FooBarState | FooBarState[]): void;
}
