import { describe, it, expect, vi } from 'vitest'
import { dateToBlock } from './index'
import { type PublicClient } from 'viem'

describe('dateToBlock', () => {
  const mockClient = {
    getBlock: vi.fn(),
  } as unknown as PublicClient

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should find block number for valid date', async () => {
    const targetDate = new Date('2023-01-01')
    mockClient.getBlock
      .mockResolvedValueOnce({ number: 1n, timestamp: 1609459200n }) // first block
      .mockResolvedValueOnce({ number: 16424500n, timestamp: 1672531200n }) // latest block
      .mockResolvedValueOnce({ number: 8212250n, timestamp: 1672531200n }) // mid block

    const result = await dateToBlock(mockClient, targetDate)

    expect(result.block.number).toBeDefined()
    expect(result.retries).toBeGreaterThan(0)
    expect(result.secondsFromTarget).toBeLessThanOrEqual(60n * 60n * 3n)
  })

  it('should throw error for future date', async () => {
    const futureDate = new Date(Date.now() + 86400000) // tomorrow
    mockClient.getBlock
      .mockResolvedValueOnce({ number: 1n, timestamp: 1609459200n })
      .mockResolvedValueOnce({ 
        number: 16424500n, 
        timestamp: BigInt(Math.floor(Date.now() / 1000))
      })

    await expect(dateToBlock(mockClient, futureDate))
      .rejects
      .toThrow('is in the future')
  })

  it('should return first block for very early date', async () => {
    const earlyDate = new Date('2015-01-01')
    const firstBlock = {
      number: 1n,
      timestamp: 1438269973n, // First Ethereum block timestamp
    }
    mockClient.getBlock
      .mockResolvedValueOnce(firstBlock)
      .mockResolvedValueOnce({ number: 16424500n, timestamp: 1672531200n })

    const result = await dateToBlock(mockClient, earlyDate)

    expect(result.block.number).toBe(firstBlock.number)
    expect(result.retries).toBe(0)
  })

  it('should throw error when max retries exceeded', async () => {
    const targetDate = new Date('2023-01-01')
    mockClient.getBlock
      .mockResolvedValueOnce({ number: 1n, timestamp: 1609459200n })
      .mockResolvedValueOnce({ number: 16424500n, timestamp: 1672531200n })
      .mockImplementation(() => Promise.resolve({ 
        number: 8212250n, 
        timestamp: 1641013200n 
      }))

    await expect(dateToBlock(mockClient, targetDate))
      .rejects
      .toThrow('Exceeded max retries')
  })

  it('should return block within accuracy window', async () => {
    const targetDate = new Date('2023-01-01')
    const targetTimestamp = BigInt(Math.floor(targetDate.getTime() / 1000))
    
    mockClient.getBlock
      .mockResolvedValueOnce({ number: 1n, timestamp: 1609459200n })
      .mockResolvedValueOnce({ number: 16424500n, timestamp: 1672531200n })
      .mockResolvedValueOnce({ 
        number: 8212250n, 
        timestamp: targetTimestamp + 60n * 60n // 1 hour difference
      })

    const result = await dateToBlock(mockClient, targetDate)
    
    expect(result.secondsFromTarget).toBeLessThanOrEqual(60n * 60n * 3n)
  })
})