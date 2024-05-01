import type { QuestionnaireRole } from '../QuestionnaireRole'
import type { QuestionnaireState, ValidResponse } from '../models'
import type { RecordTags, TagsBase } from '@credo-ts/core'

import { AriesFrameworkError, utils, BaseRecord } from '@credo-ts/core'

export type CustomQuestionnaireTags = TagsBase
export type DefaultQuestionnaireTags = {
  connectionId: string
  role: QuestionnaireRole
  state: QuestionnaireState
  threadId: string
}

export type QuestionnaireTags = RecordTags<QuestionnaireRecord>

export interface QuestionnaireStorageProps {
  id?: string
  createdAt?: Date
  connectionId: string
  role: QuestionnaireRole
  signatureRequired: boolean
  state: QuestionnaireState
  tags?: CustomQuestionnaireTags
  threadId: string

  //questionText: string
  //questionDetail?: string
  //validResponses: ValidResponse[]

  response?: string[]
  questions:{
	questionText: string,
	questionDetail?: string,
	validResponses: ValidResponse[]
  }[]//entidad
}

export class QuestionnaireRecord extends BaseRecord<DefaultQuestionnaireTags, CustomQuestionnaireTags> {
  //public questionText!: string
  //public questionDetail?: string
  //public validResponses!: ValidResponse[]
  public connectionId!: string
  public role!: QuestionnaireRole
  public signatureRequired!: boolean
  public state!: QuestionnaireState
  public threadId!: string
  public response?: string[]
  public questions!:{
	  questionText:string,
	  questionDetail?:string,
	  validResponses:ValidResponse[]
  }[]//entidad

  public static readonly type = 'QuestionnaireRecord'
  public readonly type = QuestionnaireRecord.type

  public constructor(props: QuestionnaireStorageProps) {
    super()

    if (props) {
      this.id = props.id ?? utils.uuid()
      this.createdAt = props.createdAt ?? new Date()
      //this.questionText = props.questionText
      //this.questionDetail = props.questionDetail
      //this.validResponses = props.validResponses
      this.connectionId = props.connectionId
      this._tags = props.tags ?? {}
      this.role = props.role
      this.signatureRequired = props.signatureRequired
      this.state = props.state
      this.threadId = props.threadId
      this.response = props.response
      this.questions=props.questions??[]//entidad
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

  public assertRole(expectedRole: QuestionnaireRole) {
    if (this.role !== expectedRole) {
      throw new AriesFrameworkError(`Invalid question answer record role ${this.role}, expected is ${expectedRole}.`)
    }
  }

  public assertState(expectedStates: QuestionnaireState | QuestionnaireState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new AriesFrameworkError(
        `Question answer record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }
}
