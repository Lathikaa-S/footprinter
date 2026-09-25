import type { AnySoupElement } from "circuit-json"
import { addThermalVias, thermalViaDef } from "src/helpers/create-thermal-vias"
import { getQuadSidePinCounts } from "src/helpers/get-quad-side-pin-counts"
import type { z } from "zod"
import { base_quad_def, quad, quadTransform, quad_def } from "./quad"

export const qfn_def = base_quad_def
  .extend(thermalViaDef.shape)
  .transform(quadTransform)

export const qfn = (
  rawParameters: z.input<typeof qfn_def>,
): { circuitJson: AnySoupElement[]; parameters: any } => {
  const qfnParameters = {
    ...rawParameters,
    legsoutside: false,
    pl: rawParameters.pl ?? 0.875,
    pw: rawParameters.pw ?? 0.25,
  }
  if (rawParameters.thermalpad === true && rawParameters.pl === undefined) {
    const parameters = quad_def.parse(qfnParameters)
    const sides = getQuadSidePinCounts(parameters)
    const thermalWidth =
      (parameters.px ?? parameters.p) *
        (Math.max(sides.top, sides.bottom) - 1) +
      parameters.pw
    const thermalHeight =
      (parameters.py ?? parameters.p) *
        (Math.max(sides.left, sides.right) - 1) +
      (parameters.leftrightpadwidth ?? parameters.pw)
    // quad places outer pad edges 0.1 mm inside the body. Leave a further
    // 0.1 mm copper gap to the inferred EP, including its centre offset.
    // Keep explicit pad lengths and thermal-pad dimensions caller-controlled.
    const maxPadLength =
      Math.min(
        (parameters.w - thermalWidth) / 2 -
          Math.abs(parameters.thermalpadcenteroffsetx),
        (parameters.h - thermalHeight) / 2 -
          Math.abs(parameters.thermalpadcenteroffsety),
      ) - 0.2
    if (maxPadLength <= 0) {
      throw new Error(
        "No room for automatic QFN pads with 0.1 mm thermal-pad clearance; check package dimensions and thermal pad offsets",
      )
    }
    qfnParameters.pl = Math.min(qfnParameters.pl, maxPadLength)
  }
  const quadResult = quad(qfnParameters)
  const thermalViaParameters = thermalViaDef.parse(rawParameters)

  return {
    circuitJson: addThermalVias(quadResult.circuitJson, thermalViaParameters),
    parameters: { ...quadResult.parameters, ...thermalViaParameters },
  }
}
