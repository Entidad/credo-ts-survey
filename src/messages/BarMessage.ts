import { AgentMessage, IsValidMessageType, parseMessageType } from '@aries-framework/core'
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class BarMessage extends AgentMessage {
  /**
   * Create new BarMessage instance.
   * @param options
   */
  public constructor(options: { id?: string; response: string; threadId: string }) {
    super()

    if (options) {
      this.id = options.id || this.generateId()
      this.setThread({ threadId: options.threadId })
      this.response = options.response
    }
  }

  @IsValidMessageType(BarMessage.type)
  public readonly type = BarMessage.type.messageTypeUri
  public static readonly type = parseMessageType('https://didcomm.org/questionanswer/1.0/answer')

  @Expose({ name: 'response' })
  @IsString()
  public response!: string
}
