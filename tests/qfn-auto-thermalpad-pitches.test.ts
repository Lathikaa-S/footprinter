import { expect, test } from "bun:test"
import { fp } from "../src/footprinter"
import { getMinimumPadGap } from "./fixtures/get-minimum-pad-gap"

test("QFN thermal pad sizing uses separate axis pitches", () => {
  const circuitJson = fp
    .string("qfn16_w3_h3_px0.6mm_py0.4mm_thermalpad")
    .circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(2.05, 8)
  expect(thermalPad?.height).toBeCloseTo(1.45, 8)
  expect(pads[0]?.width).toBeCloseTo(0.275, 8)
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.1, 8)
})
