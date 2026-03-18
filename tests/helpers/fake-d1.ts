type Row = Record<string, unknown>

class FakePreparedStatement {
  private bindings: unknown[] = []

  constructor(private readonly db: FakeD1Database, private readonly sql: string) {}

  bind(...params: unknown[]) {
    this.bindings = params
    return this
  }

  async run() {
    if (this.sql.startsWith('INSERT INTO image_analysis')) {
      const id = this.db.insertImageAnalysis({
        image_url: String(this.bindings[0]),
        original_name: String(this.bindings[1]),
        mime_type: String(this.bindings[2]),
        ai_response: String(this.bindings[3]),
        prompt_used: this.bindings[4] == null ? null : String(this.bindings[4])
      })

      return {
        success: true,
        meta: {
          last_row_id: id
        }
      }
    }

    return { success: true, meta: {} }
  }

  async first<T = Row>() {
    if (this.sql.startsWith('SELECT * FROM image_analysis WHERE id = ?')) {
      const id = Number(this.bindings[0])
      return (this.db.findImageAnalysisById(id) ?? null) as T | null
    }

    if (this.sql.startsWith('SELECT COUNT(*) as total FROM image_analysis')) {
      return ({ total: this.db.countImageAnalysis() } as unknown) as T
    }

    return null
  }

  async all<T = Row>() {
    if (this.sql.startsWith('SELECT * FROM image_analysis ORDER BY created_at DESC LIMIT ? OFFSET ?')) {
      const limit = Number(this.bindings[0])
      const offset = Number(this.bindings[1])
      const rows = this.db.listImageAnalysis(limit, offset)
      return {
        success: true,
        results: rows as T[]
      }
    }

    return {
      success: true,
      results: [] as T[]
    }
  }
}

export class FakeD1Database {
  private autoIncrementId = 1
  private readonly imageAnalysisRows: Array<{
    id: number
    image_url: string
    original_name: string
    mime_type: string
    ai_response: string
    prompt_used: string | null
    created_at: string
  }> = []

  prepare(sql: string) {
    return new FakePreparedStatement(this, sql)
  }

  insertImageAnalysis(input: {
    image_url: string
    original_name: string
    mime_type: string
    ai_response: string
    prompt_used: string | null
  }) {
    const id = this.autoIncrementId++
    this.imageAnalysisRows.unshift({
      id,
      ...input,
      created_at: new Date().toISOString()
    })

    return id
  }

  findImageAnalysisById(id: number) {
    return this.imageAnalysisRows.find((row) => row.id === id) ?? null
  }

  listImageAnalysis(limit: number, offset: number) {
    return this.imageAnalysisRows.slice(offset, offset + limit)
  }

  countImageAnalysis() {
    return this.imageAnalysisRows.length
  }
}
