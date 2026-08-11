import type { Tour } from '../types'
import { ADD_PRODUCT_TOUR, ADD_PRODUCT_TOUR_ID } from './add-product'
import { MERCHANT_CONSOLE_TOUR, MERCHANT_TOUR_ID, WIZARD_ROUTES } from './merchant-console'

/* ============================================================================
   The tour registry
   ----------------------------------------------------------------------------
   Order matters: `tourForPath` takes the first tour that claims the path, so
   the most specific scope goes first. The add-a-product tour owns exactly one
   route; the console tour owns everything else under /merchant.
   ========================================================================== */

export const TOURS: Tour[] = [ADD_PRODUCT_TOUR, MERCHANT_CONSOLE_TOUR]

/** The tour responsible for a given path, if any. */
export function tourForPath(pathname: string): Tour | undefined {
  return TOURS.find((t) => t.scope(pathname))
}

export function tourById(id: string): Tour | undefined {
  return TOURS.find((t) => t.id === id)
}

export {
  ADD_PRODUCT_TOUR,
  ADD_PRODUCT_TOUR_ID,
  MERCHANT_CONSOLE_TOUR,
  MERCHANT_TOUR_ID,
  WIZARD_ROUTES,
}
