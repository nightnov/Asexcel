import React from 'react'
import { render, screen } from '@testing-library/react'
import ChatMessage from '@/components/ChatMessage'

// react-markdown ships ESM-only, which next/jest's SWC transform can't
// parse (its default node_modules exclusion can be appended to but not
// overridden — see jest.config.js history). The tests below only assert
// that the message text ends up visible, not that markdown is actually
// rendered to HTML, so a plain passthrough stub is enough.
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => children,
}))

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
  it('should render user message', () => {
    render(<ChatMessage role="user" content="How do I use VLOOKUP?" />)
    expect(screen.getByText('How do I use VLOOKUP?')).toBeInTheDocument()
  })

  it('should render assistant message', () => {
    render(
      <ChatMessage
        role="assistant"
        content="VLOOKUP searches for a value in the first column of a range and returns a value in the same row from another column."
      />
    )
    expect(
      screen.getByText(/VLOOKUP searches for a value/)
    ).toBeInTheDocument()
  })

  it('should distinguish between user and assistant messages', () => {
    const { container: userContainer } = render(
      <ChatMessage role="user" content="Same text" />
    )
    const { container: assistantContainer } = render(
      <ChatMessage role="assistant" content="Same text" />
    )

    // User message should have different styling/classes than assistant
    expect(userContainer.innerHTML).not.toBe(assistantContainer.innerHTML)
  })

  it('should render markdown content in assistant message', () => {
    render(<ChatMessage role="assistant" content={'# Heading\n\n**Bold text** and *italic*'} />)
    // Should render without crashing
    expect(screen.getByText(/Heading/)).toBeInTheDocument()
  })

  it('should handle empty content', () => {
    const { container } = render(<ChatMessage role="user" content="" />)
    expect(container).toBeInTheDocument()
  })

  it('should handle long content', () => {
    render(<ChatMessage role="assistant" content={'A'.repeat(1000)} />)
    expect(screen.getByText(/A{100}/)).toBeInTheDocument()
  })
})
