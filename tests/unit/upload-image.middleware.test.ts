import { describe, expect, it } from 'vitest'
import { parseAndValidateAnalyzeMultipart } from '../../src/middleware/upload-image'

describe('parseAndValidateAnalyzeMultipart', () => {
  it('throws when content type is not multipart/form-data', async () => {
    const request = new Request('http://localhost/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    await expect(parseAndValidateAnalyzeMultipart(request)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_INPUT'
    })
  })

  it('throws when mime type is invalid', async () => {
    const form = new FormData()
    form.append('image', new Blob(['abc'], { type: 'text/plain' }), 'note.txt')

    const request = new Request('http://localhost/test', {
      method: 'POST',
      body: form
    })

    await expect(parseAndValidateAnalyzeMultipart(request)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_INPUT'
    })
  })

  it('throws when file size exceeds 10MB', async () => {
    const form = new FormData()
    form.append('image', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'image/png' }), 'big.png')

    const request = new Request('http://localhost/test', {
      method: 'POST',
      body: form
    })

    await expect(parseAndValidateAnalyzeMultipart(request)).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_INPUT'
    })
  })

  it('returns parsed payload when valid', async () => {
    const form = new FormData()
    form.append('image', new Blob(['image-content'], { type: 'image/png' }), 'ok.png')

    const request = new Request('http://localhost/test', {
      method: 'POST',
      body: form
    })

    const parsed = await parseAndValidateAnalyzeMultipart(request)

    expect(parsed.image.name).toBe('ok.png')
    expect(parsed.image.type).toBe('image/png')
  })
})
