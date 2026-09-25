import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { fp } from "../src/footprinter"
import { createBooleanDifferenceVisualization } from "../src/helpers/boolean-difference"

test("QFN16 repro has copper clearance and matches KiCad pin pitch and EP", async () => {
  const response = await fetch(
    "https://kicad-mod-cache.tscircuit.com/Package_DFN_QFN.pretty/QFN-16-1EP_3x3mm_P0.5mm_EP1.75x1.75mm.circuit.json",
  )
  expect(response.ok).toBe(true)
  const kicadPads = any_circuit_element
    .array()
    .parse(await response.json())
    .filter((element) => element.type === "pcb_smtpad")
  // Preserve the exact automatic-dimension input from PR #894.
  const pads = fp
    .string("qfn16_w3_h3_p0.5mm_thermalpad")
    .circuitJson()
    .filter((element) => element.type === "pcb_smtpad")
  expect(pads).toHaveLength(17)
  expect(kicadPads).toHaveLength(17)

  for (const [index, pad] of pads.entries()) {
    let pin = pad.port_hints?.[0]
    if (pin === undefined) throw new Error("Generated pad is missing its pin")
    if (pin === "thermalpad") pin = "17"
    const reference = kicadPads.find((candidate) =>
      candidate.port_hints?.includes(pin),
    )
    if (pad.shape !== "rect" || reference?.shape !== "rect") {
      throw new Error("Expected matching rectangular pads")
    }
    expect(pad.layer).toBe(reference.layer)
    if (pin === "17") {
      expect(pad.x).toBeCloseTo(reference.x, 8)
      expect(pad.y).toBeCloseTo(reference.y, 8)
      expect(pad.width).toBeCloseTo(reference.width, 8)
      expect(pad.height).toBeCloseTo(reference.height, 8)
    } else if (pad.width > pad.height) {
      expect(pad.y).toBeCloseTo(reference.y, 8)
      expect(pad.height).toBeCloseTo(reference.height, 8)
      expect(Math.sign(pad.x)).toBe(Math.sign(reference.x))
    } else {
      expect(pad.x).toBeCloseTo(reference.x, 8)
      expect(pad.width).toBeCloseTo(reference.width, 8)
      expect(Math.sign(pad.y)).toBe(Math.sign(reference.y))
    }

    for (const other of pads.slice(index + 1)) {
      if (other.shape !== "rect") throw new Error("Expected rectangular pad")
      const gapX = Math.abs(pad.x - other.x) - (pad.width + other.width) / 2
      const gapY = Math.abs(pad.y - other.y) - (pad.height + other.height) / 2
      expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(0.1 - 1e-8)
    }
  }

  // This overlay exposes the different outer spans and pad lengths, not full copper parity.
  const comparisonSvg = createBooleanDifferenceVisualization(pads, kicadPads, {
    title: "QFN16 repro vs KiCad: pitch and EP parity only",
    operation: "intersection",
    footprintNameA: "Auto QFN16 (#894)",
    footprintNameB: "QFN16, 3x3, EP1.75",
  })
  expect(comparisonSvg).toMatchSvgSnapshot(
    import.meta.path,
    "qfn16-auto-thermalpad-kicad",
  )
})
