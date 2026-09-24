import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { fp } from "../src/footprinter"

const footprints = [
  "qfn16_w3_h3_p0.5mm_thermalpad",
  "qfn20_w4.5_h3.5_p0.5mm_thermalpad",
  "qfn8_w2_h2_p0.5mm_thermalpad",
]

for (const footprint of footprints) {
  test(`${footprint} reproduction snapshot`, () => {
    const circuitJson = fp.string(footprint).circuitJson()
    expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
      import.meta.path,
      footprint,
    )
  })

  // Reproduction only: remove .failing when the default geometry is fixed.
  // These pads already overlap without any traces, router, or Gerber exporter.
  test.failing(`${footprint} should not overlap its thermal pad`, () => {
    const pads = fp
      .string(footprint)
      .circuitJson()
      .filter((element) => element.type === "pcb_smtpad")
    const thermalPad = pads.find((pad) =>
      pad.port_hints.includes("thermalpad"),
    )!
    if (thermalPad.shape !== "rect") throw new Error("Expected rectangular EP")

    const overlappingPins = pads
      .filter((pad) => pad !== thermalPad)
      .filter((pad) => {
        if (pad.shape !== "rect") throw new Error("Expected rectangular pad")
        // Use an inscribed rectangle, excluding all rounded corners. A positive
        // intersection here proves actual copper overlap, not just AABB overlap.
        const halfWidth = pad.width / 2 - (pad.corner_radius ?? 0)
        const halfHeight = pad.height / 2 - (pad.corner_radius ?? 0)
        const overlapX =
          Math.min(pad.x + halfWidth, thermalPad.x + thermalPad.width / 2) -
          Math.max(pad.x - halfWidth, thermalPad.x - thermalPad.width / 2)
        const overlapY =
          Math.min(pad.y + halfHeight, thermalPad.y + thermalPad.height / 2) -
          Math.max(pad.y - halfHeight, thermalPad.y - thermalPad.height / 2)
        return overlapX > 1e-9 && overlapY > 1e-9
      })
      .map((pad) => pad.port_hints)

    expect(overlappingPins).toEqual([])
  })
}
