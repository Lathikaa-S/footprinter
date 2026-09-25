import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { fp } from "../src/footprinter"

function getMinimumPadGap(circuitJson: AnyCircuitElement[]) {
  const pads = circuitJson.filter((element) => element.type === "pcb_smtpad")
  let minimumGap = Number.POSITIVE_INFINITY
  for (const [i, pad] of pads.entries()) {
    for (const other of pads.slice(i + 1)) {
      if (
        (pad.shape !== "rect" && pad.shape !== "pill") ||
        (other.shape !== "rect" && other.shape !== "pill")
      ) {
        throw new Error("Expected rectangular or pill pads")
      }
      const gapX = Math.abs(pad.x - other.x) - (pad.width + other.width) / 2
      const gapY = Math.abs(pad.y - other.y) - (pad.height + other.height) / 2
      minimumGap = Math.min(minimumGap, Math.max(gapX, gapY))
    }
  }
  return minimumGap
}

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
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn16-auto-thermalpad-clearance",
  )
})

test("rectangular QFN20 default pads clear the thermal pad", () => {
  const circuitJson = fp
    .string("qfn20_w4.5_h3.5_p0.5mm_thermalpad")
    .circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(2.25, 8)
  expect(thermalPad?.height).toBeCloseTo(2.25, 8)
  expect(pads[0]?.width).toBeCloseTo(0.425, 8)
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.1, 8)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn20-auto-thermalpad-clearance",
  )
})

test("QFN8 default pads clear the thermal pad", () => {
  const circuitJson = fp.string("qfn8_w2_h2_p0.5mm_thermalpad").circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(0.75, 8)
  expect(thermalPad?.height).toBeCloseTo(0.75, 8)
  expect(pads[0]?.width).toBeCloseTo(0.425, 8)
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.1, 8)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn8-auto-thermalpad-clearance",
  )
})

test("QFN preserves explicit left-right pad length", () => {
  const circuitJson = fp
    .string("qfn16_w3_h3_thermalpad_lrpl0.3mm")
    .circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(1.75, 8)
  expect(thermalPad?.height).toBeCloseTo(1.75, 8)
  expect(pads[0]?.width).toBeCloseTo(0.3, 8)
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.1, 8)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn-auto-thermalpad-lrpl",
  )
})

test("QFN default pads account for thermal pad offsets", () => {
  const circuitJson = fp
    .string(
      "qfn16_w3_h3_thermalpad_thermalpadcenteroffsetx0.2mm_thermalpadcenteroffsety-0.1mm",
    )
    .circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(1.75, 8)
  expect(thermalPad?.height).toBeCloseTo(1.75, 8)
  expect(pads[0]?.width).toBeCloseTo(0.225, 8)
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.1, 8)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn-auto-thermalpad-offset",
  )
})

test("QFN pill pads clear the thermal pad", () => {
  const circuitJson = fp.string("qfn16_w3_h3_thermalpad_pillpads").circuitJson()
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
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn-auto-thermalpad-pill",
  )
})

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
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn-auto-thermalpad-pitches",
  )
})

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
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.15, 8)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn32-auto-thermalpad-unchanged",
  )
})

test("QFN preserves explicit perimeter pad length", () => {
  const circuitJson = fp.string("qfn16_w3_h3_thermalpad_pl0.3mm").circuitJson()
  const pads = circuitJson.filter(
    (element) =>
      element.type === "pcb_smtpad" &&
      (element.shape === "rect" || element.shape === "pill"),
  )
  const thermalPad = pads.find((pad) => pad.port_hints?.includes("thermalpad"))
  expect(thermalPad?.width).toBeCloseTo(1.75, 8)
  expect(thermalPad?.height).toBeCloseTo(1.75, 8)
  expect(pads[0]?.width).toBeCloseTo(0.3, 8)
  expect(getMinimumPadGap(circuitJson)).toBeCloseTo(0.225, 8)
  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "qfn-auto-thermalpad-explicit",
  )
})

test("QFN rejects a body too small for automatic pad clearance", () => {
  expect(() => fp.string("qfn16_w2_h2_thermalpad").circuitJson()).toThrow(
    "No room for automatic QFN pads",
  )
})

test("QFN rejects a thermal pad offset that leaves no pad length", () => {
  expect(() =>
    fp
      .string("qfn16_w3_h3_thermalpad_thermalpadcenteroffsetx0.6mm")
      .circuitJson(),
  ).toThrow("No room for automatic QFN pads")
})
