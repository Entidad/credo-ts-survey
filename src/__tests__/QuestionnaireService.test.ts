import type { AgentConfig, AgentContext, Repository, Wallet } from '@aries-framework/core'
import type { QuestionnaireStateChangedEvent, ValidResponse } from '@entidad/questionnaire'

import { EventEmitter, SigningProviderRegistry, InboundMessageContext, DidExchangeState } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { Subject } from 'rxjs'

import { getAgentConfig, getAgentContext, getMockConnection, mockFunction } from '../../../core/tests/helpers'
import { IndySdkWallet } from '../../../indy-sdk/src'
import { indySdk } from '../../../indy-sdk/tests/setupIndySdkModule'

import {
  QuestionnaireRecord,
  QuestionnaireRepository,
  QuestionnaireEventTypes,
  QuestionnaireRole,
  QuestionnaireService,
  QuestionnaireState,
  QuestionMessage,
  AnswerMessage,
} from '@entidad/questionnaire'

jest.mock('../repository/QuestionnaireRepository')
const QuestionnaireRepositoryMock = QuestionnaireRepository as jest.Mock<QuestionnaireRepository>

describe('QuestionnaireService', () => {
  const mockConnectionRecord = getMockConnection({
    id: 'd3849ac3-c981-455b-a1aa-a10bea6cead8',
    did: 'did:sov:C2SsBf5QUQpqSAQfhu3sd2',
    state: DidExchangeState.Completed,
  })

  let wallet: Wallet
  let agentConfig: AgentConfig
  let questionnaireRepository: Repository<QuestionnaireRecord>
  let questionnaireService: QuestionnaireService
  let eventEmitter: EventEmitter
  let agentContext: AgentContext

  const mockQuestionnaireRecord = (options: {
    questionText: string
    questionDetail?: string
    connectionId: string
    role: QuestionnaireRole
    signatureRequired: boolean
    state: QuestionnaireState
    threadId: string
    validResponses: ValidResponse[]
  }) => {
    return new QuestionnaireRecord({
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
    agentConfig = getAgentConfig('QuestionnaireServiceTest')
    wallet = new IndySdkWallet(indySdk, agentConfig.logger, new SigningProviderRegistry([]))
    agentContext = getAgentContext()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await wallet.createAndOpen(agentConfig.walletConfig!)
  })

  beforeEach(async () => {
    questionnaireRepository = new QuestionnaireRepositoryMock()
    eventEmitter = new EventEmitter(agentDependencies, new Subject())
    questionnaireService = new QuestionnaireService(questionnaireRepository, eventEmitter, agentConfig.logger)
  })

  afterAll(async () => {
    await wallet.delete()
  })

  describe('create question', () => {
    it(`emits a question with question text, valid responses, and question answer record`, async () => {
      const eventListenerMock = jest.fn()
      eventEmitter.on<QuestionnaireStateChangedEvent>(
        QuestionnaireEventTypes.QuestionnaireStateChanged,
        eventListenerMock
      )

      const questionMessage = new QuestionMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        signatureRequired: false,
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      await questionnaireService.createQuestion(agentContext, mockConnectionRecord.id, {
        question: questionMessage.questionText,
        validResponses: questionMessage.validResponses,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'QuestionnaireStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          questionnaireRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            questionText: questionMessage.questionText,
            role: QuestionnaireRole.Questioner,
            state: QuestionnaireState.QuestionSent,
            validResponses: questionMessage.validResponses,
          }),
        },
      })
    })
  })
  describe('create answer', () => {
    let mockRecord: QuestionnaireRecord

    beforeAll(() => {
      mockRecord = mockQuestionnaireRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: QuestionnaireRole.Responder,
        signatureRequired: false,
        state: QuestionnaireState.QuestionReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it(`throws an error when invalid response is provided`, async () => {
      expect(questionnaireService.createAnswer(agentContext, mockRecord, 'Maybe')).rejects.toThrowError(
        `Response does not match valid responses`
      )
    })

    it(`emits an answer with a valid response and question answer record`, async () => {
      const eventListenerMock = jest.fn()
      eventEmitter.on<QuestionnaireStateChangedEvent>(
        QuestionnaireEventTypes.QuestionnaireStateChanged,
        eventListenerMock
      )

      mockFunction(questionnaireRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await questionnaireService.createAnswer(agentContext, mockRecord, 'Yes')

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'QuestionnaireStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: QuestionnaireState.QuestionReceived,
          questionnaireRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: QuestionnaireRole.Responder,
            state: QuestionnaireState.AnswerSent,
            response: 'Yes',
          }),
        },
      })
    })
  })

  describe('processReceiveQuestion', () => {
    let mockRecord: QuestionnaireRecord

    beforeAll(() => {
      mockRecord = mockQuestionnaireRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: QuestionnaireRole.Responder,
        signatureRequired: false,
        state: QuestionnaireState.QuestionReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('creates record when no previous question with that thread exists', async () => {
      const questionMessage = new QuestionMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new InboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const questionnaireRecord = await questionnaireService.processReceiveQuestion(messageContext)

      expect(questionnaireRecord).toMatchObject(
        expect.objectContaining({
          role: QuestionnaireRole.Responder,
          state: QuestionnaireState.QuestionReceived,
          threadId: questionMessage.id,
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
    })

    it(`throws an error when question from the same thread exists `, async () => {
      mockFunction(questionnaireRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const questionMessage = new QuestionMessage({
        id: '123',
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new InboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionnaireService.processReceiveQuestion(messageContext)).rejects.toThrowError(
        `Question answer record with thread Id ${questionMessage.id} already exists.`
      )
      jest.resetAllMocks()
    })
  })

  describe('receiveAnswer', () => {
    let mockRecord: QuestionnaireRecord

    beforeAll(() => {
      mockRecord = mockQuestionnaireRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: QuestionnaireRole.Questioner,
        signatureRequired: false,
        state: QuestionnaireState.QuestionReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('updates state and emits event when valid response is received', async () => {
      mockRecord.state = QuestionnaireState.QuestionSent
      mockFunction(questionnaireRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new AnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const questionnaireRecord = await questionnaireService.receiveAnswer(messageContext)

      expect(questionnaireRecord).toMatchObject(
        expect.objectContaining({
          role: QuestionnaireRole.Questioner,
          state: QuestionnaireState.AnswerReceived,
          threadId: '123',
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
      jest.resetAllMocks()
    })

    it(`throws an error when no existing question is found`, async () => {
      const answerMessage = new AnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionnaireService.receiveAnswer(messageContext)).rejects.toThrowError(
        `Question Answer record with thread Id ${answerMessage.threadId} not found.`
      )
    })

    it(`throws an error when record is in invalid state`, async () => {
      mockRecord.state = QuestionnaireState.AnswerReceived
      mockFunction(questionnaireRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new AnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionnaireService.receiveAnswer(messageContext)).rejects.toThrowError(
        `Question answer record is in invalid state ${mockRecord.state}. Valid states are: ${QuestionnaireState.QuestionSent}`
      )
      jest.resetAllMocks()
    })

    it(`throws an error when record is in invalid role`, async () => {
      mockRecord.state = QuestionnaireState.QuestionSent
      mockRecord.role = QuestionnaireRole.Responder
      mockFunction(questionnaireRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new AnswerMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionnaireService.receiveAnswer(messageContext)).rejects.toThrowError(
        `Invalid question answer record role ${mockRecord.role}, expected is ${QuestionnaireRole.Questioner}`
      )
    })
    jest.resetAllMocks()
  })
})
