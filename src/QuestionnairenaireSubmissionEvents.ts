import type { QuestionnairenaireSubmissionState } from './models'
import type { QuestionnairenaireSubmissionRecord } from './repository'
import type { BaseEvent } from '@aries-framework/core'

export enum QuestionnairenaireSubmissionEventTypes {
  QuestionnairenaireSubmissionStateChanged = 'QuestionnairenaireSubmissionStateChanged',
}
export interface QuestionnairenaireSubmissionStateChangedEvent extends BaseEvent {
  type: typeof QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged
  payload: {
    previousState: QuestionnairenaireSubmissionState | null
    questionSubmissionRecord: QuestionnairenaireSubmissionRecord
  }
}
