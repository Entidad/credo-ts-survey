import { AgentMessage, IsValidMessageType, parseMessageType } from '@credo-ts/core'
import { Expose, Type } from 'class-transformer'
import { IsBoolean, IsInstance, IsOptional, IsString, ValidateNested, IsArray/*entidad*/ } from 'class-validator'

import { ValidResponse } from '../models'

export class QuestionMessage extends AgentMessage {
  /**
   * Create new QuestionMessage instance.
   * @param options
   */
  public constructor(options: {
    //questionText: string
    //questionDetail?: string
    //validResponses: ValidResponse[]
    signatureRequired?: boolean
    id?: string
    nonce?: string
    questions:{
	    questionText: string,
	    questionDetail?: string,
	    validResponses: ValidResponse[]
    }[]//entidad
  }) {
    super()

    if (options) {
      this.id = options.id || this.generateId()
      this.nonce = options.nonce
      //this.questionText = options.questionText
      //this.questionDetail = options.questionDetail
      this.signatureRequired = options.signatureRequired
      //this.validResponses = options.validResponses
      this.questions = options.questions||[]//entidad
    }
  }

  @IsValidMessageType(QuestionMessage.type)
  public readonly type = QuestionMessage.type.messageTypeUri
  public static readonly type = parseMessageType('https://didcomm.org/questionnaire/1.0/question')

  @IsOptional()
  @IsString()
  public nonce?: string

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'signature_required' })
  public signatureRequired?: boolean

//  @Expose({ name: 'valid_responses' })
//  @Type(() => ValidResponse)
//  @ValidateNested({ each: true })
//  @IsInstance(ValidResponse, { each: true })
//  public validResponses!: ValidResponse[]

//  @Expose({ name: 'question_text' })
//  @IsString()
//  public questionText!: string

  @Expose({ name: 'questions' })
  @IsArray()
  public questions!: {
	    questionText: string,
	    questionDetail?: string,
	    validResponses: ValidResponse[]
  }[]//entidad

//  @IsOptional()
//  @Expose({ name: 'question_detail' })
//  @IsString()
//  public questionDetail?: string
}
