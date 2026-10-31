// Small building blocks shared by the plane models.
import * as THREE from 'three';

export const mat = (col, extra = {}) => new THREE.MeshStandardMaterial({ color: col, flatShading: true, roughness: 0.6, metalness: 0.2, ...extra });

// A flat shape with some thickness (wings, tail fins). points = [[a, b], ...] in the shape's own 2D plane.
export function slab(points, depth, m) {
  const sh = new THREE.Shape();
  sh.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) sh.lineTo(points[i][0], points[i][1]);
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, m);
}

// A flat 5-pointed star (for markings)
export function star(radius, depth, m) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? radius * 0.42 : radius, a = Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return slab(pts, depth, m);
}
