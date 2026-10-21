import { useMemo } from "react";
import { ExtrudeGeometry, Shape } from "three";

export function useHeartGeometry() {
  return useMemo(() => {
    const points: Array<[number, number]> = [];
    for (let i = 0; i <= 96; i += 1) {
      const t = (i / 96) * Math.PI * 2;
      const x = 16 * Math.sin(t) ** 3;
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      points.push([x * 0.062, y * 0.062]);
    }
    const shape = new Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i][0], points[i][1]);
    shape.closePath();
    const geo = new ExtrudeGeometry(shape, {
      depth: 2.2,
      bevelEnabled: true,
      bevelSegments: 10,
      steps: 1,
      bevelSize: 0.34,
      bevelThickness: 0.5,
      curveSegments: 24,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);
}
