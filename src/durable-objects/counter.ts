export class Counter {
  private state: DurableObjectState
  private value: number = 0

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Load value from storage
    this.value = (await this.state.storage.get('value')) || 0

    switch (url.pathname) {
      case '/increment':
        this.value++
        await this.state.storage.put('value', this.value)
        return new Response(String(this.value))

      case '/decrement':
        this.value--
        await this.state.storage.put('value', this.value)
        return new Response(String(this.value))

      case '/value':
        return new Response(String(this.value))

      case '/reset':
        this.value = 0
        await this.state.storage.put('value', 0)
        return new Response(String(this.value))

      default:
        return new Response('Not found', { status: 404 })
    }
  }
}
