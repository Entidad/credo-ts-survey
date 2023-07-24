import type { QuestionnaireRecord } from './repository'
import type { Query } from '@aries-framework/core'

import {
  AgentContext,
  ConnectionService,
  OutboundMessageContext,
  injectable,
  MessageSender,
} from '@aries-framework/core'

import { AnswerMessageHandler, QuestionMessageHandler } from './handlers'
import { ValidResponse } from './models'
import { QuestionnaireService } from './services'

@injectable()
export class QuestionnaireApi {
  private questionnaireService: QuestionnaireService
  private messageSender: MessageSender
  private connectionService: ConnectionService
  private agentContext: AgentContext

  public constructor(
    questionnaireService: QuestionnaireService,
    messageSender: MessageSender,
    connectionService: ConnectionService,
    agentContext: AgentContext
  ) {
    this.questionnaireService = questionnaireService
    this.messageSender = messageSender
    this.connectionService = connectionService
    this.agentContext = agentContext

    this.agentContext.dependencyManager.registerMessageHandlers([
      new QuestionMessageHandler(this.questionnaireService),
      new AnswerMessageHandler(this.questionnaireService),
    ])
  }

  /**
   * Create a question message with possible valid responses, then send message to the
   * holder
   *
   * @param connectionId connection to send the question message to
   * @param config config for creating question message
   * @returns Questionnaire record
   */
  public async sendQuestion(
    connectionId: string,
    config: {
      question: string
      validResponses: ValidResponse[]
      detail?: string
      questions:{
	questionText: string,
	questionDetail?: string,
	validResponses: ValidResponse[]
      }[]//entidad
    }
  ) {
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const { questionMessage, questionnaireRecord } = await this.questionnaireService.createQuestion(
      this.agentContext,
      connectionId,
      {
        question: config.question,
        validResponses: config.validResponses.map((item) => new ValidResponse(item)),
        detail: config?.detail,
        questions: config.questions,//entidad
      }
    )
    const outboundMessageContext = new OutboundMessageContext(questionMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: questionnaireRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return questionnaireRecord
  }

  /**
   * Create an answer message as the holder and send it in response to a question message
   *
   * @param questionRecordId the id of the questionnaire record
   * @param response response included in the answer message
   * @returns Questionnaire record
   */
  public async sendAnswer(questionRecordId: string, response: string) {
    const questionRecord = await this.questionnaireService.getById(this.agentContext, questionRecordId)

    const { answerMessage, questionnaireRecord } = await this.questionnaireService.createAnswer(
      this.agentContext,
      questionRecord,
      response
    )

    const connection = await this.connectionService.getById(this.agentContext, questionRecord.connectionId)

    const outboundMessageContext = new OutboundMessageContext(answerMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: questionnaireRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return questionnaireRecord
  }

  /**
   * Get all Questionnaire records
   *
   * @returns list containing all Questionnaire records
   */
  public getAll() {
    return this.questionnaireService.getAll(this.agentContext)
  }

  /**
   * Get all Questionnaire records by specified query params
   *
   * @returns list containing all Questionnaire records matching specified query params
   */
  public findAllByQuery(query: Query<QuestionnaireRecord>) {
    return this.questionnaireService.findAllByQuery(this.agentContext, query)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionnaireId The questionnaire record id
   * @return The question answer record or null if not found
   *
   */
  public findById(questionnaireId: string) {
    return this.questionnaireService.findById(this.agentContext, questionnaireId)
  }
}
