import type { QuestionnairenaireSubmissionRecord } from './repository'
import type { Query } from '@aries-framework/core'

import {
  AgentContext,
  ConnectionService,
  OutboundMessageContext,
  injectable,
  MessageSender,
} from '@aries-framework/core'

import { SubmissionMessageHandler, QuestionnaireMessageHandler } from './handlers'
import { ValidResponse } from './models'
import { QuestionnairenaireSubmissionService } from './services'

@injectable()
export class QuestionnairenaireSubmissionApi {
  private questionSubmissionService: QuestionnairenaireSubmissionService
  private messageSender: MessageSender
  private connectionService: ConnectionService
  private agentContext: AgentContext

  public constructor(
    questionSubmissionService: QuestionnairenaireSubmissionService,
    messageSender: MessageSender,
    connectionService: ConnectionService,
    agentContext: AgentContext
  ) {
    this.questionSubmissionService = questionSubmissionService
    this.messageSender = messageSender
    this.connectionService = connectionService
    this.agentContext = agentContext

    this.agentContext.dependencyManager.registerMessageHandlers([
      new QuestionnaireMessageHandler(this.questionSubmissionService),
      new SubmissionMessageHandler(this.questionSubmissionService),
    ])
  }

  /**
   * Create a question message with possible valid responses, then send message to the
   * holder
   *
   * @param connectionId connection to send the question message to
   * @param config config for creating question message
   * @returns QuestionnairenaireSubmission record
   */
  public async sendQuestionnaire(
    connectionId: string,
    config: {
      question: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const connection = await this.connectionService.getById(this.agentContext, connectionId)
    connection.assertReady()

    const { questionMessage, questionSubmissionRecord } = await this.questionSubmissionService.createQuestionnaire(
      this.agentContext,
      connectionId,
      {
        question: config.question,
        validResponses: config.validResponses.map((item) => new ValidResponse(item)),
        detail: config?.detail,
      }
    )
    const outboundMessageContext = new OutboundMessageContext(questionMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: questionSubmissionRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return questionSubmissionRecord
  }

  /**
   * Create an answer message as the holder and send it in response to a question message
   *
   * @param questionRecordId the id of the questionSubmission record
   * @param response response included in the answer message
   * @returns QuestionnairenaireSubmission record
   */
  public async sendSubmission(questionRecordId: string, response: string) {
    const questionRecord = await this.questionSubmissionService.getById(this.agentContext, questionRecordId)

    const { answerMessage, questionSubmissionRecord } = await this.questionSubmissionService.createSubmission(
      this.agentContext,
      questionRecord,
      response
    )

    const connection = await this.connectionService.getById(this.agentContext, questionRecord.connectionId)

    const outboundMessageContext = new OutboundMessageContext(answerMessage, {
      agentContext: this.agentContext,
      connection,
      associatedRecord: questionSubmissionRecord,
    })

    await this.messageSender.sendMessage(outboundMessageContext)

    return questionSubmissionRecord
  }

  /**
   * Get all QuestionnairenaireSubmission records
   *
   * @returns list containing all QuestionnairenaireSubmission records
   */
  public getAll() {
    return this.questionSubmissionService.getAll(this.agentContext)
  }

  /**
   * Get all QuestionnairenaireSubmission records by specified query params
   *
   * @returns list containing all QuestionnairenaireSubmission records matching specified query params
   */
  public findAllByQuery(query: Query<QuestionnairenaireSubmissionRecord>) {
    return this.questionSubmissionService.findAllByQuery(this.agentContext, query)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionSubmissionId The questionSubmission record id
   * @return The question answer record or null if not found
   *
   */
  public findById(questionSubmissionId: string) {
    return this.questionSubmissionService.findById(this.agentContext, questionSubmissionId)
  }
}
