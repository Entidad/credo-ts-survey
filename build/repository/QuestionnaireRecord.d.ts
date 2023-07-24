import type { QuestionnaireRole } from '../QuestionnaireRole';
import type { QuestionnaireState, ValidResponse } from '../models';
import type { RecordTags, TagsBase } from '@aries-framework/core';
import { BaseRecord } from '@aries-framework/core';
export type CustomQuestionnaireTags = TagsBase;
export type DefaultQuestionnaireTags = {
    connectionId: string;
    role: QuestionnaireRole;
    state: QuestionnaireState;
    threadId: string;
};
export type QuestionnaireTags = RecordTags<QuestionnaireRecord>;
export interface QuestionnaireStorageProps {
    id?: string;
    createdAt?: Date;
    connectionId: string;
    role: QuestionnaireRole;
    signatureRequired: boolean;
    state: QuestionnaireState;
    tags?: CustomQuestionnaireTags;
    threadId: string;
    questionText: string;
    questionDetail?: string;
    validResponses: ValidResponse[];
    response?: string;
}
export declare class QuestionnaireRecord extends BaseRecord<DefaultQuestionnaireTags, CustomQuestionnaireTags> {
    questionText: string;
    questionDetail?: string;
    validResponses: ValidResponse[];
    connectionId: string;
    role: QuestionnaireRole;
    signatureRequired: boolean;
    state: QuestionnaireState;
    threadId: string;
    response?: string;
    static readonly type = "QuestionnaireRecord";
    readonly type = "QuestionnaireRecord";
    constructor(props: QuestionnaireStorageProps);
    getTags(): {
        connectionId: string;
        role: QuestionnaireRole;
        state: QuestionnaireState;
        threadId: string;
    };
    assertRole(expectedRole: QuestionnaireRole): void;
    assertState(expectedStates: QuestionnaireState | QuestionnaireState[]): void;
}
