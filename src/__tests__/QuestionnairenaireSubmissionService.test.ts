import type { AgentConfig, AgentContext, Repository, Wallet } from '@aries-framework/core'
import type { QuestionnairenaireSubmissionStateChangedEvent, ValidResponse } from '@aries-framework/question-answer'

import { EventEmitter, SigningProviderRegistry, InboundMessageContext, DidExchangeState } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { Subject } from 'rxjs'

import { getAgentConfig, getAgentContext, getMockConnection, mockFunction } from '../../../core/tests/helpers'
import { IndySdkWallet } from '../../../indy-sdk/src'
import { indySdk } from '../../../indy-sdk/tests/setupIndySdkModule'

import {
  QuestionnairenaireSubmissionRecord,
  QuestionnairenaireSubmissionRepository,
  QuestionnairenaireSubmissionEventTypes,
  QuestionnairenaireSubmissionRole,
  QuestionnairenaireSubmissionService,
  QuestionnairenaireSubmissionState,
  QuestionnaireMessage,
  SubmissionMessage,
} from '@aries-framework/question-answer'

jest.mock('../repository/QuestionnairenaireSubmissionRepository')
const QuestionnairenaireSubmissionRepositoryMock = QuestionnairenaireSubmissionRepository as jest.Mock<QuestionnairenaireSubmissionRepository>

describe('QuestionnairenaireSubmissionService', () => {
  const mockConnectionRecord = getMockConnection({
    id: 'd3849ac3-c981-455b-a1aa-a10bea6cead8',
    did: 'did:sov:C2SsBf5QUQpqSAQfhu3sd2',
    state: DidExchangeState.Completed,
  })

  let wallet: Wallet
  let agentConfig: AgentConfig
  let questionSubmissionRepository: Repository<QuestionnairenaireSubmissionRecord>
  let questionSubmissionService: QuestionnairenaireSubmissionService
  let eventEmitter: EventEmitter
  let agentContext: AgentContext

  const mockQuestionnairenaireSubmissionRecord = (options: {
    questionText: string
    questionDetail?: string
    connectionId: string
    role: QuestionnairenaireSubmissionRole
    signatureRequired: boolean
    state: QuestionnairenaireSubmissionState
    threadId: string
    validResponses: ValidResponse[]
  }) => {
    return new QuestionnairenaireSubmissionRecord({
      questionText: options.questionText,
      questionDetail: options.questionDetail,
      connectionId: options.connectionId,
      role: options.role,
      signatureRequired: options.signatureRequired,
      state: options.state,
      threadId: options.threadId,
      validResponses: options.validResponses,
    })
  }

  beforeAll(async () => {
    agentConfig = getAgentConfig('QuestionnairenaireSubmissionServiceTest')
    wallet = new IndySdkWallet(indySdk, agentConfig.logger, new SigningProviderRegistry([]))
    agentContext = getAgentContext()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await wallet.createAndOpen(agentConfig.walletConfig!)
  })

  beforeEach(async () => {
    questionSubmissionRepository = new QuestionnairenaireSubmissionRepositoryMock()
    eventEmitter = new EventEmitter(agentDependencies, new Subject())
    questionSubmissionService = new QuestionnairenaireSubmissionService(questionSubmissionRepository, eventEmitter, agentConfig.logger)
  })

  afterAll(async () => {
    await wallet.delete()
  })

  describe('create question', () => {
    it(`emits a question with question text, valid responses, and question answer record`, async () => {
      const eventListenerMock = jest.fn()
      eventEmitter.on<QuestionnairenaireSubmissionStateChangedEvent>(
        QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
        eventListenerMock
      )

      const questionMessage = new QuestionnaireMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        signatureRequired: false,
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      await questionSubmissionService.createQuestionnaire(agentContext, mockConnectionRecord.id, {
        question: questionMessage.questionText,
        validResponses: questionMessage.validResponses,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'QuestionnairenaireSubmissionStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          questionSubmissionRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            questionText: questionMessage.questionText,
            role: QuestionnairenaireSubmissionRole.Questionnaireer,
            state: QuestionnairenaireSubmissionState.QuestionnaireSent,
            validResponses: questionMessage.validResponses,
          }),
        },
      })
    })
  })
  describe('create answer', () => {
    let mockRecord: QuestionnairenaireSubmissionRecord

    beforeAll(() => {
      mockRecord = mockQuestionnairenaireSubmissionRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: QuestionnairenaireSubmissionRole.Responder,
        signatureRequired: false,
        state: QuestionnairenaireSubmissionState.QuestionnaireReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it(`throws an error when invalid response is provided`, async () => {
      expect(questionSubmissionService.createSubmission(agentContext, mockRecord, 'Maybe')).rejects.toThrowError(
        `Response does not match valid responses`
      )
    })

    it(`emits an answer with a valid response and question answer record`, async () => {
      const eventListenerMock = jest.fn()
      eventEmitter.on<QuestionnairenaireSubmissionStateChangedEvent>(
        QuestionnairenaireSubmissionEventTypes.QuestionnairenaireSubmissionStateChanged,
        eventListenerMock
      )

      mockFunction(questionSubmissionRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await questionSubmissionService.createSubmission(agentContext, mockRecord, 'Yes')

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'QuestionnairenaireSubmissionStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: QuestionnairenaireSubmissionState.QuestionnaireReceived,
          questionSubmissionRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: QuestionnairenaireSubmissionRole.Responder,
            state: QuestionnairenaireSubmissionState.SubmissionSent,
            response: 'Yes',
          }),
        },
      })
    })
  })

  describe('processReceiveQuestionnaire', () => {
    let mockRecord: QuestionnairenaireSubmissionRecord

    beforeAll(() => {
      mockRecord = mockQuestionnairenaireSubmissionRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: QuestionnairenaireSubmissionRole.Responder,
        signatureRequired: false,
        state: QuestionnairenaireSubmissionState.QuestionnaireReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('creates record when no previous question with that thread exists', async () => {
      const questionMessage = new QuestionnaireMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new InboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const questionSubmissionRecord = await questionSubmissionService.processReceiveQuestionnaire(messageContext)

      expect(questionSubmissionRecord).toMatchObject(
        expect.objectContaining({
          role: QuestionnairenaireSubmissionRole.Responder,
          state: QuestionnairenaireSubmissionState.QuestionnaireReceived,
          threadId: questionMessage.id,
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
    })

    it(`throws an error when question from the same thread exists `, async () => {
      mockFunction(questionSubmissionRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const questionMessage = new QuestionnaireMessage({
        id: '123',
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new InboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionSubmissionService.processReceiveQuestionnaire(messageContext)).rejects.toThrowError(
        `Questionnaire answer record with thread Id ${questionMessage.id} already exists.`
      )
      jest.resetAllMocks()
    })
  })

  describe('receiveSubmission', () => {
    let mockRecord: QuestionnairenaireSubmissionRecord

    beforeAll(() => {
      mockRecord = mockQuestionnairenaireSubmissionRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: QuestionnairenaireSubmissionRole.Questionnaireer,
        signatureRequired: false,
        state: QuestionnairenaireSubmissionState.QuestionnaireReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('updates state and emits event when valid response is received', async () => {
      mockRecord.state = QuestionnairenaireSubmissionState.QuestionnaireSent
      mockFunction(questionSubmissionRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new SubmissionMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const questionSubmissionRecord = await questionSubmissionService.receiveSubmission(messageContext)

      expect(questionSubmissionRecord).toMatchObject(
        expect.objectContaining({
          role: QuestionnairenaireSubmissionRole.Questionnaireer,
          state: QuestionnairenaireSubmissionState.SubmissionReceived,
          threadId: '123',
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
      jest.resetAllMocks()
    })

    it(`throws an error when no existing question is found`, async () => {
      const answerMessage = new SubmissionMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionSubmissionService.receiveSubmission(messageContext)).rejects.toThrowError(
        `Questionnaire Submission record with thread Id ${answerMessage.threadId} not found.`
      )
    })

    it(`throws an error when record is in invalid state`, async () => {
      mockRecord.state = QuestionnairenaireSubmissionState.SubmissionReceived
      mockFunction(questionSubmissionRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new SubmissionMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionSubmissionService.receiveSubmission(messageContext)).rejects.toThrowError(
        `Questionnaire answer record is in invalid state ${mockRecord.state}. Valid states are: ${QuestionnairenaireSubmissionState.QuestionnaireSent}`
      )
      jest.resetAllMocks()
    })

    it(`throws an error when record is in invalid role`, async () => {
      mockRecord.state = QuestionnairenaireSubmissionState.QuestionnaireSent
      mockRecord.role = QuestionnairenaireSubmissionRole.Responder
      mockFunction(questionSubmissionRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new SubmissionMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionSubmissionService.receiveSubmission(messageContext)).rejects.toThrowError(
        `Invalid question answer record role ${mockRecord.role}, expected is ${QuestionnairenaireSubmissionRole.Questionnaireer}`
      )
    })
    jest.resetAllMocks()
  })
})
