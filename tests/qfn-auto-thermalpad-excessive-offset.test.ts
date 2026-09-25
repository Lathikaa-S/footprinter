import { expect, test } from "bun:test"
import { fp } from "../src/footprinter"

test("QFN rejects a thermal pad offset that leaves no pad length", () => {
  expect(() =>
    fp
      .string("qfn16_w3_h3_thermalpad_thermalpadcenteroffsetx0.6mm")
      .circuitJson(),
  ).toThrow("No room for automatic QFN pads")
})
