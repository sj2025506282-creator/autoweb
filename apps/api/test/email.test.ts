import { describe, expect, it } from 'vitest'
import { escapeHtml, outreachEmailTemplate, reservationEmailTemplate } from '../src/services/email'

describe('email templates', () => {
  it('escapes all HTML metacharacters', () => {
    expect(escapeHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#039;')
  })

  it('uses the complete public demo URL supplied by production config', () => {
    const html = outreachEmailTemplate({
      restaurantName: 'Demo Kitchen',
      demoUrl: 'https://demo-kitchen.example.com',
    })
    expect(html).toContain('href="https://demo-kitchen.example.com"')
  })

  it('escapes an unsafe demo URL before placing it in an href', () => {
    const html = outreachEmailTemplate({
      restaurantName: 'Demo Kitchen',
      demoUrl: 'https://example.com/" onclick="alert(1)',
    })
    expect(html).not.toContain('" onclick="')
    expect(html).toContain('&quot; onclick=&quot;')
  })

  it('escapes the restaurant name in outreach emails', () => {
    const html = outreachEmailTemplate({
      restaurantName: '<script>alert(1)</script>',
      demoUrl: 'https://example.com',
    })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('includes the outreach call to action', () => {
    const html = outreachEmailTemplate({
      restaurantName: 'Demo Kitchen',
      demoUrl: 'https://example.com',
    })
    expect(html).toContain('View Your Demo Site')
  })

  it('escapes customer-controlled reservation fields', () => {
    const html = reservationEmailTemplate({
      restaurantName: '<b>Kitchen</b>',
      customerName: '<img src=x>',
      phone: '<123>',
      email: 'a&b@example.com',
      partySize: 2,
      time: '"tomorrow"',
      note: "'window'",
    })
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x&gt;')
    expect(html).toContain('a&amp;b@example.com')
  })

  it('renders an em dash for an empty reservation note', () => {
    const html = reservationEmailTemplate({
      restaurantName: 'Kitchen',
      customerName: 'Guest',
      phone: '123',
      email: 'guest@example.com',
      partySize: 2,
      time: '2030-01-01T12:00:00Z',
      note: '',
    })
    expect(html).toContain('<td>—</td>')
  })

  it('renders party size as a number', () => {
    const html = reservationEmailTemplate({
      restaurantName: 'Kitchen',
      customerName: 'Guest',
      phone: '123',
      email: 'guest@example.com',
      partySize: 12,
      time: '2030-01-01T12:00:00Z',
      note: 'Window',
    })
    expect(html).toContain('<td>12</td>')
  })

  it('includes reply-friendly outreach copy', () => {
    const html = outreachEmailTemplate({
      restaurantName: 'Demo Kitchen',
      demoUrl: 'https://example.com',
    })
    expect(html).toContain('Just reply to this email!')
  })

  it('keeps absolute HTTPS URLs unchanged', () => {
    const url = 'https://cafe.example.com/menu?preview=1'
    const html = outreachEmailTemplate({
      restaurantName: 'Cafe',
      demoUrl: url,
    })
    expect(html).toContain(url)
  })
})
