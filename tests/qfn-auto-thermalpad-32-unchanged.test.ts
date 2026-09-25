import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { fp } from "../src/footprinter"

test("QFN32 keeps its already-separated default pad length", () => {
  const circuitJson = fp.string("qfn32_thermalpad").circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(3.75, 8)
  expect(thermalPad?.height).toBeCloseTo(3.75, 8)
  expect(pads[0]?.width).toBeCloseTo(0.875, 8)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn32-auto-thermalpad-unchanged",
  )
})
