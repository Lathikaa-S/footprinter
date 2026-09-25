import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { fp } from "../src/footprinter"
import { createBooleanDifferenceVisualization } from "../src/helpers/boolean-difference"

test("QFN32 explicit land pattern matches KiCad pad geometry", async () => {
  const response = await fetch(
    "https://kicad-mod-cache.tscircuit.com/Package_DFN_QFN.pretty/QFN-32-1EP_5x5mm_P0.5mm_EP3.1x3.1mm.circuit.json",
  )
  expect(response.ok).toBe(true)
  const kicadCircuitJson = any_circuit_element
    .array()
    .parse(await response.json())
  const kicadPads = kicadCircuitJson.filter(
    (element) => element.type === "pcb_smtpad",
  )

  // KiCad's outer copper span is 5.75 mm; quad adds a 0.1 mm edge inset per side.
  const circuitJson = fp
    .string("qfn32_w5.95mm_h5.95mm_p0.5mm_thermalpad3.1x3.1mm")
    .circuitJson()
  const pads = circuitJson.filter((element) => element.type === "pcb_smtpad")
  expect(pads).toHaveLength(33)
  expect(kicadPads).toHaveLength(33)

  for (const pad of pads) {
    let pin = pad.port_hints?.[0]
    if (pin === undefined) throw new Error("Generated pad is missing its pin")
    // KiCad numbers this package's exposed pad as pin 33.
    if (pin === "thermalpad") pin = "33"
    const kicadPad = kicadPads.find((reference) =>
      reference.port_hints?.includes(pin),
    )
    if (pad.shape !== "rect" || kicadPad?.shape !== "rect") {
      throw new Error("Expected matching rectangular pads")
    }
    expect(pad.layer).toBe(kicadPad.layer)
    expect(pad.x).toBeCloseTo(kicadPad.x, 8)
    expect(pad.y).toBeCloseTo(kicadPad.y, 8)
    expect(pad.width).toBeCloseTo(kicadPad.width, 8)
    expect(pad.height).toBeCloseTo(kicadPad.height, 8)
    expect(pad.corner_radius ?? 0).toBeCloseTo(kicadPad.corner_radius ?? 0, 8)
  }

  const comparisonSvg = createBooleanDifferenceVisualization(pads, kicadPads, {
    title: "QFN32 copper parity: footprinter vs KiCad",
    operation: "intersection",
    footprintNameA: "footprinter QFN32, EP 3.1 mm",
    footprintNameB: "QFN-32-1EP_5x5mm_P0.5mm_EP3.1x3.1mm",
  })
  expect(comparisonSvg).toMatchSvgSnapshot(
    import.meta.path,
    "qfn32-auto-thermalpad-unchanged",
  )
})
