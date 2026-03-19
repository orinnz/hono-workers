import type { Bindings, AppContext } from '../types'
import { BarcodeService, type BarcodeProduct } from '../services/barcode/barcode.service'
import { HttpError } from '../lib/http-error'

const BARCODE_REGEX = /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/

export interface BarcodeHandlerDependencies {
  barcodeService?: BarcodeService
}

export class BarcodeHandler {
  private readonly barcodeService: BarcodeService

  constructor(dependencies: BarcodeHandlerDependencies = {}) {
    this.barcodeService = dependencies.barcodeService ?? new BarcodeService()
  }

  async getByQuery(c: AppContext) {
    const barcode = c.req.query('barcode')?.trim() ?? ''
    return this.lookupBarcode(c, barcode)
  }

  async getByParam(c: AppContext) {
    const barcode = c.req.param('barcode')?.trim() ?? ''
    return this.lookupBarcode(c, barcode)
  }

  async postByBarcode(c: AppContext) {
    let barcode = ''

    try {
      const body = await c.req.json<{ barcode?: string }>()
      barcode = body.barcode?.trim() ?? ''
    } catch {
      return c.json({ error: 'Invalid barcode format' }, 400)
    }

    return this.lookupBarcode(c, barcode)
  }

  private async lookupBarcode(c: AppContext, barcode: string) {
    if (!this.isValidBarcode(barcode)) {
      return c.json({ error: 'Invalid barcode format' }, 400)
    }

    try {
      const product = await this.barcodeService.lookupByBarcode(barcode)
      return c.json(product, 200)
    } catch (error) {
      if (error instanceof HttpError) {
        return c.json({ error: error.message, code: error.code }, error.status as any)
      }

      console.error('Barcode lookup error:', error)
      return c.json({ error: 'Internal server error' }, 500)
    }
  }

  private isValidBarcode(barcode: string): boolean {
    if (!BARCODE_REGEX.test(barcode)) {
      return false
    }

    return this.validateCheckDigit(barcode)
  }

  private validateCheckDigit(barcode: string): boolean {
    const digits = barcode.split('').map(Number)
    const checkDigit = digits[digits.length - 1]
    const payload = digits.slice(0, -1)

    let sum = 0

    for (let index = payload.length - 1; index >= 0; index--) {
      const fromRight = payload.length - index
      const multiplier = fromRight % 2 === 1 ? 3 : 1
      sum += payload[index] * multiplier
    }

    const calculatedCheckDigit = (10 - (sum % 10)) % 10
    return calculatedCheckDigit === checkDigit
  }
}
