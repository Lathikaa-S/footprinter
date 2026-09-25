import { expect, test } from "bun:test"
import { fp } from "../src/footprinter"

test("QFN rejects a body too small for automatic pad clearance", () => {
  expect(() => fp.string("qfn16_w2_h2_thermalpad").circuitJson()).toThrow(
    "No room for automatic QFN pads",
  )
})
