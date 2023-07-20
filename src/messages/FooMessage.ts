import { AgentMessage, IsValidMessageType, parseMessageType } from '@aries-framework/core'
import { Expose, Type } from 'class-transformer'
import { IsBoolean, IsInstance, IsOptional, IsString, ValidateNested } from 'class-validator'

import { ValidResponse } from '../models'

export class FooMessage extends AgentMessage {
  /**
   * Create new FooMessage instance.
   * @param options
   */
  public constructor(options: {
    fooText: string
    fooDetail?: string
    validResponses: ValidResponse[]
    signatureRequired?: boolean
    id?: string
    nonce?: string
  }) {
    super()

    if (options) {
      this.id = options.id || this.generateId()
      this.nonce = options.nonce
      this.fooText = options.fooText
      this.fooDetail = options.fooDetail
      this.signatureRequired = options.signatureRequired
      this.validResponses = options.validResponses
    }
  }

  @IsValidMessageType(FooMessage.type)
  public readonly type = FooMessage.type.messageTypeUri
  public static readonly type = parseMessageType('https://didcomm.org/foobar/1.0/foo')

  @IsOptional()
  @IsString()
  public nonce?: string

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'signature_required' })
  public signatureRequired?: boolean

  @Expose({ name: 'valid_responses' })
  @Type(() => ValidResponse)
  @ValidateNested({ each: true })
  @IsInstance(ValidResponse, { each: true })
  public validResponses!: ValidResponse[]

  @Expose({ name: 'foo_text' })
  @IsString()
  public fooText!: string

  @IsOptional()
  @Expose({ name: 'foo_detail' })
  @IsString()
  public fooDetail?: string
}
