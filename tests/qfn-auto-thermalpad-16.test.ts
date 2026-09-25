import { expect, test } from "bun:test"
import { fp } from "../src/footprinter"
import { getMinimumPadGap } from "./fixtures/get-minimum-pad-gap"

test("QFN16 default pads clear the thermal pad and corner neighbours", () => {
  const circuitJson = fp.string("qfn16_w3_h3_p0.5mm_thermalpad").circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(1.75, 8)
  expect(thermalPad?.height).toBeCloseTo(1.75, 8)
  expect(pads[0]?.width).toBeCloseTo(0.425, 8)
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.1, 8)
})
