import type { FooBarState } from './models';
import type { FooBarRecord } from './repository';
import type { BaseEvent } from '@aries-framework/core';
export declare enum FooBarEventTypes {
    FooBarStateChanged = "FooBarStateChanged"
}
export interface FooBarStateChangedEvent extends BaseEvent {
    type: typeof FooBarEventTypes.FooBarStateChanged;
    payload: {
        previousState: FooBarState | null;
        questionBarRecord: FooBarRecord;
    };
}
