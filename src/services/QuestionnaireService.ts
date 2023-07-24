import type { QuestionnaireStateChangedEvent } from '../QuestionnaireEvents'
import type { ValidResponse } from '../models'
import type { AgentContext, InboundMessageContext, Query } from '@aries-framework/core'

import { AriesFrameworkError, EventEmitter, inject, injectable, InjectionSymbols, Logger } from '@aries-framework/core'

import { QuestionnaireEventTypes } from '../QuestionnaireEvents'
import { QuestionnaireRole } from '../QuestionnaireRole'
import { AnswerMessage, QuestionMessage } from '../messages'
import { QuestionnaireState } from '../models'
import { QuestionnaireRepository, QuestionnaireRecord } from '../repository'

@injectable()
export class QuestionnaireService {
  private questionnaireRepository: QuestionnaireRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    questionnaireRepository: QuestionnaireRepository,
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger
  ) {
    this.questionnaireRepository = questionnaireRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }
  /**
   * Create a question message and a new Questionnaire record for the questioner role
   *
   * @param question text for question message
   * @param details optional details for question message
   * @param connectionId connection for Questionnaire record
   * @param validResponses array of valid responses for question
   * @returns question message and Questionnaire record
   */
  public async createQuestion(
    agentContext: AgentContext,
    connectionId: string,
    config: {
      question: string
      validResponses: ValidResponse[]
      detail?: string
    }
  ) {
    const questionMessage = new QuestionMessage({
      questionText: config.question,
      questionDetail: config?.detail,
      signatureRequired: false,
      validResponses: config.validResponses,
    })

    const questionnaireRecord = await this.createRecord({
      questionText: questionMessage.questionText,
      questionDetail: questionMessage.questionDetail,
      threadId: questionMessage.threadId,
      connectionId: connectionId,
      role: QuestionnaireRole.Questioner,
      signatureRequired: false,
      state: QuestionnaireState.QuestionSent,
      validResponses: questionMessage.validResponses,
    })

    await this.questionnaireRepository.save(agentContext, questionnaireRecord)

    this.eventEmitter.emit<QuestionnaireStateChangedEvent>(agentContext, {
      type: QuestionnaireEventTypes.QuestionnaireStateChanged,
      payload: { previousState: null, questionnaireRecord },
    })

    return { questionMessage, questionnaireRecord }
  }

  /**
   * receive question message and create record for responder role
   *
   * @param messageContext the message context containing a question message
   * @returns Questionnaire record
   */
  public async processReceiveQuestion(
    messageContext: InboundMessageContext<QuestionMessage>
  ): Promise<QuestionnaireRecord> {
    const { message: questionMessage } = messageContext

    this.logger.debug(`Receiving question message with id ${questionMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const questionRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      questionMessage.id
    )
    if (questionRecord) {
      throw new AriesFrameworkError(`Question answer record with thread Id ${questionMessage.id} already exists.`)
    }
    const questionnaireRecord = await this.createRecord({
      questionText: questionMessage.questionText,
      questionDetail: questionMessage.questionDetail,
      connectionId: connection?.id,
      threadId: questionMessage.threadId,
      role: QuestionnaireRole.Responder,
      signatureRequired: false,
      state: QuestionnaireState.QuestionReceived,
      validResponses: questionMessage.validResponses,
    })

    await this.questionnaireRepository.save(messageContext.agentContext, questionnaireRecord)

    this.eventEmitter.emit<QuestionnaireStateChangedEvent>(messageContext.agentContext, {
      type: QuestionnaireEventTypes.QuestionnaireStateChanged,
      payload: { previousState: null, questionnaireRecord },
    })

    return questionnaireRecord
  }

  /**
   * create answer message, check that response is valid
   *
   * @param questionnaireRecord record containing question and valid responses
   * @param response response used in answer message
   * @returns answer message and Questionnaire record
   */
  public async createAnswer(agentContext: AgentContext, questionnaireRecord: QuestionnaireRecord, response: string) {
    const answerMessage = new AnswerMessage({ response: response, threadId: questionnaireRecord.threadId })

    questionnaireRecord.assertState(QuestionnaireState.QuestionReceived)

    questionnaireRecord.response = response

    if (questionnaireRecord.validResponses.some((e) => e.text === response)) {
      await this.updateState(agentContext, questionnaireRecord, QuestionnaireState.AnswerSent)
    } else {
      throw new AriesFrameworkError(`Response does not match valid responses`)
    }
    return { answerMessage, questionnaireRecord }
  }

  /**
   * receive answer as questioner
   *
   * @param messageContext the message context containing an answer message message
   * @returns Questionnaire record
   */
  public async receiveAnswer(messageContext: InboundMessageContext<AnswerMessage>): Promise<QuestionnaireRecord> {
    const { message: answerMessage } = messageContext

    this.logger.debug(`Receiving answer message with id ${answerMessage.id}`)

    const connection = messageContext.assertReadyConnection()
    const questionnaireRecord = await this.findByThreadAndConnectionId(
      messageContext.agentContext,
      connection.id,
      answerMessage.threadId
    )
    if (!questionnaireRecord) {
      throw new AriesFrameworkError(`Question Answer record with thread Id ${answerMessage.threadId} not found.`)
    }
    questionnaireRecord.assertState(QuestionnaireState.QuestionSent)
    questionnaireRecord.assertRole(QuestionnaireRole.Questioner)

    questionnaireRecord.response = answerMessage.response

    await this.updateState(messageContext.agentContext, questionnaireRecord, QuestionnaireState.AnswerReceived)

    return questionnaireRecord
  }

  /**
   * Update the record to a new state and emit an state changed event. Also updates the record
   * in storage.
   *
   * @param questionnaireRecord The question answer record to update the state for
   * @param newState The state to update to
   *
   */
  private async updateState(
    agentContext: AgentContext,
    questionnaireRecord: QuestionnaireRecord,
    newState: QuestionnaireState
  ) {
    const previousState = questionnaireRecord.state
    questionnaireRecord.state = newState
    await this.questionnaireRepository.update(agentContext, questionnaireRecord)

    this.eventEmitter.emit<QuestionnaireStateChangedEvent>(agentContext, {
      type: QuestionnaireEventTypes.QuestionnaireStateChanged,
      payload: {
        previousState,
        questionnaireRecord: questionnaireRecord,
      },
    })
  }

  private async createRecord(options: {
    questionText: string
    questionDetail?: string
    connectionId: string
    role: QuestionnaireRole
    signatureRequired: boolean
    state: QuestionnaireState
    threadId: string
    validResponses: ValidResponse[]
  }): Promise<QuestionnaireRecord> {
    const questionMessageRecord = new QuestionnaireRecord({
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
  ): Promise<QuestionnaireRecord> {
    return this.questionnaireRepository.getSingleByQuery(agentContext, {
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
  ): Promise<QuestionnaireRecord | null> {
    return this.questionnaireRepository.findSingleByQuery(agentContext, {
      connectionId,
      threadId,
    })
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionnaireId The questionnaire record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The question answer record
   *
   */
  public getById(agentContext: AgentContext, questionnaireId: string): Promise<QuestionnaireRecord> {
    return this.questionnaireRepository.getById(agentContext, questionnaireId)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionnaireId The questionnaire record id
   * @return The question answer record or null if not found
   *
   */
  public findById(agentContext: AgentContext, questionnaireId: string): Promise<QuestionnaireRecord | null> {
    return this.questionnaireRepository.findById(agentContext, questionnaireId)
  }

  /**
   * Retrieve a question answer record by id
   *
   * @param questionnaireId The questionnaire record id
   * @return The question answer record or null if not found
   *
   */
  public getAll(agentContext: AgentContext) {
    return this.questionnaireRepository.getAll(agentContext)
  }

  public async findAllByQuery(agentContext: AgentContext, query: Query<QuestionnaireRecord>) {
    return this.questionnaireRepository.findByQuery(agentContext, query)
  }
}
