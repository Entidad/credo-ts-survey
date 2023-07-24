import type { AgentConfig, AgentContext, Repository, Wallet } from '@aries-framework/core'
import type { FooBarStateChangedEvent, ValidResponse } from '@aries-framework/question-answer'

import { EventEmitter, SigningProviderRegistry, InboundMessageContext, DidExchangeState } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { Subject } from 'rxjs'

import { getAgentConfig, getAgentContext, getMockConnection, mockFunction } from '../../../core/tests/helpers'
import { IndySdkWallet } from '../../../indy-sdk/src'
import { indySdk } from '../../../indy-sdk/tests/setupIndySdkModule'

import {
  FooBarRecord,
  FooBarRepository,
  FooBarEventTypes,
  FooBarRole,
  FooBarService,
  FooBarState,
  FooMessage,
  BarMessage,
} from '@aries-framework/question-answer'

jest.mock('../repository/FooBarRepository')
const FooBarRepositoryMock = FooBarRepository as jest.Mock<FooBarRepository>

describe('FooBarService', () => {
  const mockConnectionRecord = getMockConnection({
    id: 'd3849ac3-c981-455b-a1aa-a10bea6cead8',
    did: 'did:sov:C2SsBf5QUQpqSAQfhu3sd2',
    state: DidExchangeState.Completed,
  })

  let wallet: Wallet
  let agentConfig: AgentConfig
  let questionBarRepository: Repository<FooBarRecord>
  let questionBarService: FooBarService
  let eventEmitter: EventEmitter
  let agentContext: AgentContext

  const mockFooBarRecord = (options: {
    questionText: string
    questionDetail?: string
    connectionId: string
    role: FooBarRole
    signatureRequired: boolean
    state: FooBarState
    threadId: string
    validResponses: ValidResponse[]
  }) => {
    return new FooBarRecord({
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
    agentConfig = getAgentConfig('FooBarServiceTest')
    wallet = new IndySdkWallet(indySdk, agentConfig.logger, new SigningProviderRegistry([]))
    agentContext = getAgentContext()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await wallet.createAndOpen(agentConfig.walletConfig!)
  })

  beforeEach(async () => {
    questionBarRepository = new FooBarRepositoryMock()
    eventEmitter = new EventEmitter(agentDependencies, new Subject())
    questionBarService = new FooBarService(questionBarRepository, eventEmitter, agentConfig.logger)
  })

  afterAll(async () => {
    await wallet.delete()
  })

  describe('create question', () => {
    it(`emits a question with question text, valid responses, and question answer record`, async () => {
      const eventListenerMock = jest.fn()
      eventEmitter.on<FooBarStateChangedEvent>(
        FooBarEventTypes.FooBarStateChanged,
        eventListenerMock
      )

      const questionMessage = new FooMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        signatureRequired: false,
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      await questionBarService.createFoo(agentContext, mockConnectionRecord.id, {
        question: questionMessage.questionText,
        validResponses: questionMessage.validResponses,
      })

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'FooBarStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: null,
          questionBarRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            questionText: questionMessage.questionText,
            role: FooBarRole.Fooer,
            state: FooBarState.FooSent,
            validResponses: questionMessage.validResponses,
          }),
        },
      })
    })
  })
  describe('create answer', () => {
    let mockRecord: FooBarRecord

    beforeAll(() => {
      mockRecord = mockFooBarRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: FooBarRole.Responder,
        signatureRequired: false,
        state: FooBarState.FooReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it(`throws an error when invalid response is provided`, async () => {
      expect(questionBarService.createBar(agentContext, mockRecord, 'Maybe')).rejects.toThrowError(
        `Response does not match valid responses`
      )
    })

    it(`emits an answer with a valid response and question answer record`, async () => {
      const eventListenerMock = jest.fn()
      eventEmitter.on<FooBarStateChangedEvent>(
        FooBarEventTypes.FooBarStateChanged,
        eventListenerMock
      )

      mockFunction(questionBarRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      await questionBarService.createBar(agentContext, mockRecord, 'Yes')

      expect(eventListenerMock).toHaveBeenCalledWith({
        type: 'FooBarStateChanged',
        metadata: {
          contextCorrelationId: 'mock',
        },
        payload: {
          previousState: FooBarState.FooReceived,
          questionBarRecord: expect.objectContaining({
            connectionId: mockConnectionRecord.id,
            role: FooBarRole.Responder,
            state: FooBarState.BarSent,
            response: 'Yes',
          }),
        },
      })
    })
  })

  describe('processReceiveFoo', () => {
    let mockRecord: FooBarRecord

    beforeAll(() => {
      mockRecord = mockFooBarRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: FooBarRole.Responder,
        signatureRequired: false,
        state: FooBarState.FooReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('creates record when no previous question with that thread exists', async () => {
      const questionMessage = new FooMessage({
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new InboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const questionBarRecord = await questionBarService.processReceiveFoo(messageContext)

      expect(questionBarRecord).toMatchObject(
        expect.objectContaining({
          role: FooBarRole.Responder,
          state: FooBarState.FooReceived,
          threadId: questionMessage.id,
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
    })

    it(`throws an error when question from the same thread exists `, async () => {
      mockFunction(questionBarRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const questionMessage = new FooMessage({
        id: '123',
        questionText: 'Alice, are you on the phone with Bob?',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })

      const messageContext = new InboundMessageContext(questionMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionBarService.processReceiveFoo(messageContext)).rejects.toThrowError(
        `Foo answer record with thread Id ${questionMessage.id} already exists.`
      )
      jest.resetAllMocks()
    })
  })

  describe('receiveBar', () => {
    let mockRecord: FooBarRecord

    beforeAll(() => {
      mockRecord = mockFooBarRecord({
        questionText: 'Alice, are you on the phone with Bob?',
        connectionId: mockConnectionRecord.id,
        role: FooBarRole.Fooer,
        signatureRequired: false,
        state: FooBarState.FooReceived,
        threadId: '123',
        validResponses: [{ text: 'Yes' }, { text: 'No' }],
      })
    })

    it('updates state and emits event when valid response is received', async () => {
      mockRecord.state = FooBarState.FooSent
      mockFunction(questionBarRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new BarMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      const questionBarRecord = await questionBarService.receiveBar(messageContext)

      expect(questionBarRecord).toMatchObject(
        expect.objectContaining({
          role: FooBarRole.Fooer,
          state: FooBarState.BarReceived,
          threadId: '123',
          questionText: 'Alice, are you on the phone with Bob?',
          validResponses: [{ text: 'Yes' }, { text: 'No' }],
        })
      )
      jest.resetAllMocks()
    })

    it(`throws an error when no existing question is found`, async () => {
      const answerMessage = new BarMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionBarService.receiveBar(messageContext)).rejects.toThrowError(
        `Foo Bar record with thread Id ${answerMessage.threadId} not found.`
      )
    })

    it(`throws an error when record is in invalid state`, async () => {
      mockRecord.state = FooBarState.BarReceived
      mockFunction(questionBarRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new BarMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionBarService.receiveBar(messageContext)).rejects.toThrowError(
        `Foo answer record is in invalid state ${mockRecord.state}. Valid states are: ${FooBarState.FooSent}`
      )
      jest.resetAllMocks()
    })

    it(`throws an error when record is in invalid role`, async () => {
      mockRecord.state = FooBarState.FooSent
      mockRecord.role = FooBarRole.Responder
      mockFunction(questionBarRepository.findSingleByQuery).mockReturnValue(Promise.resolve(mockRecord))

      const answerMessage = new BarMessage({
        response: 'Yes',
        threadId: '123',
      })

      const messageContext = new InboundMessageContext(answerMessage, {
        agentContext,
        connection: mockConnectionRecord,
      })

      expect(questionBarService.receiveBar(messageContext)).rejects.toThrowError(
        `Invalid question answer record role ${mockRecord.role}, expected is ${FooBarRole.Fooer}`
      )
    })
    jest.resetAllMocks()
  })
})
