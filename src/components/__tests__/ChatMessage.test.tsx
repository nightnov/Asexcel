import React from 'react'
import { render, screen } from '@testing-library/react'
import ChatMessage from '@/components/ChatMessage'

// Mock the LocaleProvider
jest.mock('@/components/LocaleProvider', () => ({
  useLocale: () => ({
    locale: 'fr',
    t: {
      chat: {
        assistant: 'Assistant',
        user: 'Vous',
      },
    },
  }),
}))

describe('ChatMessage', () => {
  const mockMessageUser = {
    role: 'user' as const,
    content: 'How do I use VLOOKUP?',
  }

  const mockMessageAssistant = {
    role: 'assistant' as const,
    content: 'VLOOKUP searches for a value in the first column of a range and returns a value in the same row from another column.',
  }

  it('should render user message', () => {
    render(<ChatMessage message={mockMessageUser} />)
    expect(screen.getByText('How do I use VLOOKUP?')).toBeInTheDocument()
  })

  it('should render assistant message', () => {
    render(<ChatMessage message={mockMessageAssistant} />)
    expect(
      screen.getByText(/VLOOKUP searches for a value/)
    ).toBeInTheDocument()
  })

  it('should distinguish between user and assistant messages', () => {
    const { container: userContainer } = render(
      <ChatMessage message={mockMessageUser} />
    )
    const { container: assistantContainer } = render(
      <ChatMessage message={mockMessageAssistant} />
    )

    // User message should have different styling/classes than assistant
    expect(userContainer.innerHTML).not.toBe(assistantContainer.innerHTML)
  })

  it('should render markdown content in assistant message', () => {
    const markdownMessage = {
      role: 'assistant' as const,
      content: '# Heading\n\n**Bold text** and *italic*',
    }
    render(<ChatMessage message={markdownMessage} />)
    // Should render without crashing
    expect(screen.getByText(/Heading/)).toBeInTheDocument()
  })

  it('should handle empty content', () => {
    const emptyMessage = {
      role: 'user' as const,
      content: '',
    }
    const { container } = render(<ChatMessage message={emptyMessage} />)
    expect(container).toBeInTheDocument()
  })

  it('should handle long content', () => {
    const longMessage = {
      role: 'assistant' as const,
      content: 'A'.repeat(1000),
    }
    render(<ChatMessage message={longMessage} />)
    expect(screen.getByText(/A{100}/)).toBeInTheDocument()
  })
})
