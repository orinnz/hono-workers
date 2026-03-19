import { Hono } from 'hono'
import type { Bindings } from '../types'
import { BarcodeHandler, type BarcodeHandlerDependencies } from '../handlers/barcode.handler'

export function createBarcodeRoutes(dependencies: BarcodeHandlerDependencies = {}) {
  const barcodeRoutes = new Hono<{ Bindings: Bindings }>()
  const handler = new BarcodeHandler(dependencies)

  barcodeRoutes.get('/', (c) => handler.getByQuery(c))
  barcodeRoutes.get('/:barcode', (c) => handler.getByParam(c))
  barcodeRoutes.post('/', (c) => handler.postByBarcode(c))

  return barcodeRoutes
}
