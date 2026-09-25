import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { fp } from "../src/footprinter"

test("default QFN pads clear the inferred thermal pad and each other", () => {
  const cases = [
    ["qfn16_w3_h3_p0.5mm_thermalpad", 1.75, 1.75],
    ["qfn20_w4.5_h3.5_p0.5mm_thermalpad", 2.25, 2.25],
    ["qfn8_w2_h2_p0.5mm_thermalpad", 0.75, 0.75],
    ["qfn16_w3_h3_thermalpad_lrpl0.3mm", 1.75, 1.75],
    [
      "qfn16_w3_h3_thermalpad_thermalpadcenteroffsetx0.2mm_thermalpadcenteroffsety-0.1mm",
      1.75,
      1.75,
    ],
    ["qfn16_w3_h3_thermalpad_pillpads", 1.75, 1.75],
    ["qfn16_w3_h3_px0.6mm_py0.4mm_thermalpad", 2.05, 1.45],
    // Already-separated automatic geometry should not change.
    ["qfn32_thermalpad", 3.75, 3.75],
  ] as const

  for (const [footprint, width, height] of cases) {
    const pads = fp
      .string(footprint)
      .circuitJson()
      .filter((element) => element.type === "pcb_smtpad")
    const ep = pads.find((pad) => pad.port_hints.includes("thermalpad"))!
    expect(ep).toMatchObject({ shape: "rect" })
    if (ep.shape !== "rect") throw new Error("Expected rectangular thermal pad")
    expect(ep.width).toBeCloseTo(width, 8)
    expect(ep.height).toBeCloseTo(height, 8)
    // Check every pair, including neighbouring sides at the package corners.
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
        expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(0.1 - 1e-9)
      }
    }
  }

  for (const footprint of [
    "qfn16_w2_h2_thermalpad",
    "qfn16_w3_h3_thermalpad_thermalpadcenteroffsetx0.6mm",
  ]) {
    expect(() => fp.string(footprint).circuitJson()).toThrow(
      "No room for automatic QFN pads",
    )
  }

  // Explicit pad lengths are not silently resized.
  const explicit = fp
    .string("qfn16_w3_h3_thermalpad_pl0.3mm")
    .circuitJson()
    .find(
      (element) =>
        element.type === "pcb_smtpad" && element.port_hints.includes("1"),
    )
  expect(explicit).toMatchObject({ width: 0.3, height: 0.25 })

  expect(
    convertCircuitJsonToPcbSvg(fp.string(cases[0][0]).circuitJson()),
  ).toMatchSvgSnapshot(import.meta.path, "qfn16-auto-thermalpad-clearance")
})
