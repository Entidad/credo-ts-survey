import type { QuestionnairenaireSubmissionRole } from '../QuestionnairenaireSubmissionRole';
import type { QuestionnairenaireSubmissionState, ValidResponse } from '../models';
import type { RecordTags, TagsBase } from '@aries-framework/core';
import { BaseRecord } from '@aries-framework/core';
export type CustomQuestionnairenaireSubmissionTags = TagsBase;
export type DefaultQuestionnairenaireSubmissionTags = {
    connectionId: string;
    role: QuestionnairenaireSubmissionRole;
    state: QuestionnairenaireSubmissionState;
    threadId: string;
};
export type QuestionnairenaireSubmissionTags = RecordTags<QuestionnairenaireSubmissionRecord>;
export interface QuestionnairenaireSubmissionStorageProps {
    id?: string;
    createdAt?: Date;
    connectionId: string;
    role: QuestionnairenaireSubmissionRole;
    signatureRequired: boolean;
    state: QuestionnairenaireSubmissionState;
    tags?: CustomQuestionnairenaireSubmissionTags;
    threadId: string;
    questionText: string;
    questionDetail?: string;
    validResponses: ValidResponse[];
    response?: string;
}
export declare class QuestionnairenaireSubmissionRecord extends BaseRecord<DefaultQuestionnairenaireSubmissionTags, CustomQuestionnairenaireSubmissionTags> {
    questionText: string;
    questionDetail?: string;
    validResponses: ValidResponse[];
    connectionId: string;
    role: QuestionnairenaireSubmissionRole;
    signatureRequired: boolean;
    state: QuestionnairenaireSubmissionState;
    threadId: string;
    response?: string;
    static readonly type = "QuestionnairenaireSubmissionRecord";
    readonly type = "QuestionnairenaireSubmissionRecord";
    constructor(props: QuestionnairenaireSubmissionStorageProps);
    getTags(): {
        connectionId: string;
        role: QuestionnairenaireSubmissionRole;
        state: QuestionnairenaireSubmissionState;
        threadId: string;
    };
    assertRole(expectedRole: QuestionnairenaireSubmissionRole): void;
    assertState(expectedStates: QuestionnairenaireSubmissionState | QuestionnairenaireSubmissionState[]): void;
}
