import type { QuestionnairenaireSubmissionRole } from '../QuestionnairenaireSubmissionRole'
import type { QuestionnairenaireSubmissionState, ValidResponse } from '../models'
import type { RecordTags, TagsBase } from '@aries-framework/core'

import { AriesFrameworkError, utils, BaseRecord } from '@aries-framework/core'

export type CustomQuestionnairenaireSubmissionTags = TagsBase
export type DefaultQuestionnairenaireSubmissionTags = {
  connectionId: string
  role: QuestionnairenaireSubmissionRole
  state: QuestionnairenaireSubmissionState
  threadId: string
}

export type QuestionnairenaireSubmissionTags = RecordTags<QuestionnairenaireSubmissionRecord>

export interface QuestionnairenaireSubmissionStorageProps {
  id?: string
  createdAt?: Date
  connectionId: string
  role: QuestionnairenaireSubmissionRole
  signatureRequired: boolean
  state: QuestionnairenaireSubmissionState
  tags?: CustomQuestionnairenaireSubmissionTags
  threadId: string

  questionText: string
  questionDetail?: string
  validResponses: ValidResponse[]

  response?: string
}

export class QuestionnairenaireSubmissionRecord extends BaseRecord<DefaultQuestionnairenaireSubmissionTags, CustomQuestionnairenaireSubmissionTags> {
  public questionText!: string
  public questionDetail?: string
  public validResponses!: ValidResponse[]
  public connectionId!: string
  public role!: QuestionnairenaireSubmissionRole
  public signatureRequired!: boolean
  public state!: QuestionnairenaireSubmissionState
  public threadId!: string
  public response?: string

  public static readonly type = 'QuestionnairenaireSubmissionRecord'
  public readonly type = QuestionnairenaireSubmissionRecord.type

  public constructor(props: QuestionnairenaireSubmissionStorageProps) {
    super()

    if (props) {
      this.id = props.id ?? utils.uuid()
      this.createdAt = props.createdAt ?? new Date()
      this.questionText = props.questionText
      this.questionDetail = props.questionDetail
      this.validResponses = props.validResponses
      this.connectionId = props.connectionId
      this._tags = props.tags ?? {}
      this.role = props.role
      this.signatureRequired = props.signatureRequired
      this.state = props.state
      this.threadId = props.threadId
      this.response = props.response
    }
  }

  public getTags() {
    return {
      ...this._tags,
      connectionId: this.connectionId,
      role: this.role,
      state: this.state,
      threadId: this.threadId,
    }
  }

  public assertRole(expectedRole: QuestionnairenaireSubmissionRole) {
    if (this.role !== expectedRole) {
      throw new AriesFrameworkError(`Invalid question answer record role ${this.role}, expected is ${expectedRole}.`)
    }
  }

  public assertState(expectedStates: QuestionnairenaireSubmissionState | QuestionnairenaireSubmissionState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new AriesFrameworkError(
        `Questionnaire answer record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }
}
