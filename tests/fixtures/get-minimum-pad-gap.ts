import type { AnyCircuitElement } from "circuit-json"

export function getMinimumPadGap(circuitJson: AnyCircuitElement[]) {
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
