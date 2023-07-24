import type { QuestionnaireState } from './models'
import type { QuestionnaireRecord } from './repository'
import type { BaseEvent } from '@aries-framework/core'

export enum QuestionnaireEventTypes {
  QuestionnaireStateChanged = 'QuestionnaireStateChanged',
}
export interface QuestionnaireStateChangedEvent extends BaseEvent {
  type: typeof QuestionnaireEventTypes.QuestionnaireStateChanged
  payload: {
    previousState: QuestionnaireState | null
    questionnaireRecord: QuestionnaireRecord
  }
}
