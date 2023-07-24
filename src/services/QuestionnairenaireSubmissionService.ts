import type { QuestionnairenaireSubmissionStateChangedEvent } from '../QuestionnairenaireSubmissionEvents'
import type { ValidResponse } from '../models'
import type { AgentContext, InboundMessageContext, Query } from '@aries-framework/core'

import { AriesFrameworkError, EventEmitter, inject, injectable, InjectionSymbols, Logger } from '@aries-framework/core'

import { QuestionnairenaireSubmissionEventTypes } from '../QuestionnairenaireSubmissionEvents'
import { QuestionnairenaireSubmissionRole } from '../QuestionnairenaireSubmissionRole'
import { SubmissionMessage, QuestionnaireMessage } from '../messages'
import { QuestionnairenaireSubmissionState } from '../models'
import { QuestionnairenaireSubmissionRepository, QuestionnairenaireSubmissionRecord } from '../repository'

@injectable()
export class QuestionnairenaireSubmissionService {
  private questionSubmissionRepository: QuestionnairenaireSubmissionRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    questionSubmissionRepository: QuestionnairenaireSubmissionRepository,
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger
  ) {
    this.questionSubmissionRepository = questionSubmissionRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }
  /**
   * Create a question message and a new QuestionnairenaireSubmission record for the questioner role
   *
   * @param question text for question message
   * @param details optional details for question message
   * @param connectionId connection for QuestionnairenaireSubmission record
   * @param validResponses array of valid responses for question
   * @returns question message and QuestionnairenaireSubmission record
   */
  public async createQuestionnaire(
    agentContext: AgentContext,
    connectionId: string,
    config: {
      question: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const questionMessage = new QuestionnaireMessage({
      questionText: config.question,
      questionDetail: config?.detail,
      signatureRequired: false,
      validResponses: config.validResponses,
    })

    const questionSubmissionRecord = await this.createRecord({
      questionText: questionMessage.questionText,
      questionDetail: questionMessage.questionDetail,
      threadId: questionMessage.threadId,
      connectionId: connectionId,
      role: QuestionnairenaireSubmissionRole.Questionnaireer,
      signatureRequired: false,
      state: QuestionnairenaireSubmissionState.QuestionnaireSent,
      validResponses: questionMessage.validResponses,
    })

    await this.questionSubmissionRepository.save(agentContext, questionSubmissionRecord)

    this.eventEmitter.emit<QuestionnairenaireSubmissionStateChangedEvent>(agentContext, {
      type: QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
      payload: { previousState: null, questionSubmissionRecord },
    })

    return { questionMessage, questionSubmissionRecord }
  }

  /**
   * receive question message and create record for responder role
   *
   * @param messageContext the message context containing a question message
   * @returns QuestionnairenaireSubmission record
   */
  public async processReceiveQuestionnaire(
    messageContext: InboundMessageContext<QuestionnaireMessage>
  ): Promise<QuestionnairenaireSubmissionRecord> {
    const { message: questionMessage } = messageContext

    this.logger.debug(`Receiving question message with id ${questionMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const questionRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      questionMessage.id
    )
    if (questionRecord) {
      throw new AriesFrameworkError(`Questionnaire answer record with thread Id ${questionMessage.id} already exists.`)
    }
    const questionSubmissionRecord = await this.createRecord({
      questionText: questionMessage.questionText,
      questionDetail: questionMessage.questionDetail,
      connectionId: connection?.id,
      threadId: questionMessage.threadId,
      role: QuestionnairenaireSubmissionRole.Responder,
      signatureRequired: false,
      state: QuestionnairenaireSubmissionState.QuestionnaireReceived,
      validResponses: questionMessage.validResponses,
    })

    await this.questionSubmissionRepository.save(messageContext.agentContext, questionSubmissionRecord)

    this.eventEmitter.emit<QuestionnairenaireSubmissionStateChangedEvent>(messageContext.agentContext, {
      type: QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
      payload: { previousState: null, questionSubmissionRecord },
    })

    return questionSubmissionRecord
  }

  /**
   * create answer message, check that response is valid
   *
   * @param questionSubmissionRecord record containing question and valid responses
   * @param response response used in answer message
   * @returns answer message and QuestionnairenaireSubmission record
   */
  public async createSubmission(agentContext: AgentContext, questionSubmissionRecord: QuestionnairenaireSubmissionRecord, response: string) {
    const answerMessage = new SubmissionMessage({ response: response, threadId: questionSubmissionRecord.threadId })

    questionSubmissionRecord.assertState(QuestionnairenaireSubmissionState.QuestionnaireReceived)

    questionSubmissionRecord.response = response

    if (questionSubmissionRecord.validResponses.some((e) => e.text === response)) {
      await this.updateState(agentContext, questionSubmissionRecord, QuestionnairenaireSubmissionState.SubmissionSent)
    } else {
      throw new AriesFrameworkError(`Response does not match valid responses`)
    }
    return { answerMessage, questionSubmissionRecord }
  }

  /**
   * receive answer as questioner
   *
   * @param messageContext the message context containing an answer message message
   * @returns QuestionnairenaireSubmission record
   */
  public async receiveSubmission(messageContext: InboundMessageContext<SubmissionMessage>): Promise<QuestionnairenaireSubmissionRecord> {
    const { message: answerMessage } = messageContext

    this.logger.debug(`Receiving answer message with id ${answerMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const questionSubmissionRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      answerMessage.threadId
    )
    if (!questionSubmissionRecord) {
      throw new AriesFrameworkError(`Questionnaire Submission record with thread Id ${answerMessage.threadId} not found.`)
    }
    questionSubmissionRecord.assertState(QuestionnairenaireSubmissionState.QuestionnaireSent)
    questionSubmissionRecord.assertRole(QuestionnairenaireSubmissionRole.Questionnaireer)

    questionSubmissionRecord.response = answerMessage.response

    await this.updateState(messageContext.agentContext, questionSubmissionRecord, QuestionnairenaireSubmissionState.SubmissionReceived)

    return questionSubmissionRecord
  }

  /**
   * Update the record to a new state and emit an state changed event. Also updates the record
   * in storage.
   *
   * @param questionSubmissionRecord The question answer record to update the state for
   * @param newState The state to update to
   *
   */
  private async updateState(
    agentContext: AgentContext,
    questionSubmissionRecord: QuestionnairenaireSubmissionRecord,
    newState: QuestionnairenaireSubmissionState
  ) {
    const previousState = questionSubmissionRecord.state
    questionSubmissionRecord.state = newState
    await this.questionSubmissionRepository.update(agentContext, questionSubmissionRecord)

    this.eventEmitter.emit<QuestionnairenaireSubmissionStateChangedEvent>(agentContext, {
      type: QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
      payload: {
        previousState,
        questionSubmissionRecord: questionSubmissionRecord,
      },
    })
  }

  private async createRecord(options: {
    questionText: string
    questionDetail?: string
    connectionId: string
    role: QuestionnairenaireSubmissionRole
    signatureRequired: boolean
    state: QuestionnairenaireSubmissionState
    threadId: string
    validResponses: ValidResponse[]
  }): Promise<QuestionnairenaireSubmissionRecord> {
    const questionMessageRecord = new QuestionnairenaireSubmissionRecord({
      questionText: options.questionText,
      questionDetail: options.questionDetail,
      connectionId: options.connectionId,
      threadId: options.threadId,
      role: options.role,
      signatureRequired: options.signatureRequired,
      state: options.state,
      validResponses: options.validResponses,
    })

    return questionMessageRecord
  }

  /**
   * Retrieve a question answer record by connection id and thread id
   *
   * @param connectionId The connection id
   * @param threadId The thread id
   * @throws {RecordNotFoundError} If no record is found
   * @throws {RecordDuplicateError} If multiple records are found
   * @returns The question answer record
   */
  public getByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<QuestionnairenaireSubmissionRecord> {
    return this.questionSubmissionRepository.getSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a question answer record by thread id
   *
   * @param connectionId The connection id
   * @param threadId The thread id
   * @returns The question answer record or null if not found
   */
  public findByThreadAndConnectionId(
    agentContext: AgentContext,
    connectionId: string,
    threadId: string
  ): Promise<QuestionnairenaireSubmissionRecord | null> {
    return this.questionSubmissionRepository.findSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionSubmissionId The questionSubmission record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The question answer record
   *
   */
  public getById(agentContext: AgentContext, questionSubmissionId: string): Promise<QuestionnairenaireSubmissionRecord> {
    return this.questionSubmissionRepository.getById(agentContext, questionSubmissionId)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionSubmissionId The questionSubmission record id
   * @return The question answer record or null if not found
   *
   */
  public findById(agentContext: AgentContext, questionSubmissionId: string): Promise<QuestionnairenaireSubmissionRecord | null> {
    return this.questionSubmissionRepository.findById(agentContext, questionSubmissionId)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionSubmissionId The questionSubmission record id
   * @return The question answer record or null if not found
   *
   */
  public getAll(agentContext: AgentContext) {
    return this.questionSubmissionRepository.getAll(agentContext)
  }

  public async findAllByQuery(agentContext: AgentContext, query: Query<QuestionnairenaireSubmissionRecord>) {
    return this.questionSubmissionRepository.findByQuery(agentContext, query)
  }
}
