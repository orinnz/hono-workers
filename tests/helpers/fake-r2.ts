export class FakeR2Bucket {
  private readonly objects = new Map<string, { body: ArrayBuffer; contentType: string }>()

  async put(key: string, body: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) {
    this.objects.set(key, {
      body,
      contentType: options?.httpMetadata?.contentType || 'application/octet-stream'
    })

    return {
      key,
      etag: 'fake-etag'
    }
  }

  async get(key: string) {
    const object = this.objects.get(key)

    if (!object) {
      return null
    }

    return {
      body: new Blob([object.body]).stream(),
      httpMetadata: { contentType: object.contentType },
      httpEtag: 'fake-etag'
    }
  }
}
