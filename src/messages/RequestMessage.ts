import { AgentMessage, IsValidMessageType, parseMessageType } from '@credo-ts/core'
import { Expose, Type } from 'class-transformer'
import { IsBoolean, IsInstance, IsOptional, IsString, ValidateNested, IsArray/*entidad*/ } from 'class-validator'

export class RequestMessage extends AgentMessage {
  /**
   * Create new RequestMessage instance.
   * @param options
   */
  public constructor(options: {    
    id?: string
    threadId: string    
    signatureRequired?: boolean
    request:{
	    jsonSchema: string,
	    uiSchema: string,
      initData?: string,
      i18nData?: string
    }
    expirationDate?:string
  }) {
    super()

    if (options) {
      this.id = options.id || this.generateId()
      this.setThread({ threadId: options.threadId })
      this.signatureRequired = options.signatureRequired
      this.expirationDate=options.expirationDate
      this.request = options.request
    }
  }

  @IsValidMessageType(RequestMessage.type)
  public readonly type = RequestMessage.type.messageTypeUri
  public static readonly type = parseMessageType('https://didcomm.org/survey/1.0/request')

  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'signature_required' })
  public signatureRequired?: boolean

  @IsOptional()
  @IsString()
  public expirationDate?: string

  @Expose({ name: 'request' })
  public request!: {
      jsonSchema: string,
	    uiSchema: string,
      initData?: string,
      i18nData?: string
  }
}
