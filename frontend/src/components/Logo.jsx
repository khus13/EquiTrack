// EquiTrack logo (frontend/public/equitrack-logo.png). `width` is in pixels.
export default function Logo({ width = 120 }) {
  return <img src="/equitrack-logo.png" alt="EquiTrack" width={width} style={{ display: 'block', height: 'auto' }} />;
}
