import type { FooBarRole } from '../FooBarRole'
import type { FooBarState, ValidResponse } from '../models'
import type { RecordTags, TagsBase } from '@aries-framework/core'

import { AriesFrameworkError, utils, BaseRecord } from '@aries-framework/core'

export type CustomFooBarTags = TagsBase
export type DefaultFooBarTags = {
  connectionId: string
  role: FooBarRole
  state: FooBarState
  threadId: string
}

export type FooBarTags = RecordTags<FooBarRecord>

export interface FooBarStorageProps {
  id?: string
  createdAt?: Date
  connectionId: string
  role: FooBarRole
  signatureRequired: boolean
  state: FooBarState
  tags?: CustomFooBarTags
  threadId: string

  questionText: string
  questionDetail?: string
  validResponses: ValidResponse[]

  response?: string
}

export class FooBarRecord extends BaseRecord<DefaultFooBarTags, CustomFooBarTags> {
  public questionText!: string
  public questionDetail?: string
  public validResponses!: ValidResponse[]
  public connectionId!: string
  public role!: FooBarRole
  public signatureRequired!: boolean
  public state!: FooBarState
  public threadId!: string
  public response?: string

  public static readonly type = 'FooBarRecord'
  public readonly type = FooBarRecord.type

  public constructor(props: FooBarStorageProps) {
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

  public assertRole(expectedRole: FooBarRole) {
    if (this.role !== expectedRole) {
      throw new AriesFrameworkError(`Invalid question answer record role ${this.role}, expected is ${expectedRole}.`)
    }
  }

  public assertState(expectedStates: FooBarState | FooBarState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new AriesFrameworkError(
        `Foo answer record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }
}
