/**
 * Aurora glass background system — layered blurred radial blobs (aqua/magenta/deep),
 * grid veil, film grain, and darkening overlays.
 */
export function AuroraBackground() {
  return (
    <div className="aurora-background">
      {/* Aurora blobs — large soft radial gradients, animated floating */}
      <div
        className="aurora-blob aurora-blob-aqua animate-float"
        style={{
          width: '600px',
          height: '600px',
          top: '10%',
          left: '15%',
          opacity: 0.45,
          animationDelay: '0s',
        }}
      />
      <div
        className="aurora-blob aurora-blob-magenta animate-float"
        style={{
          width: '700px',
          height: '700px',
          top: '40%',
          right: '10%',
          opacity: 0.52,
          animationDelay: '5s',
        }}
      />
      <div
        className="aurora-blob aurora-blob-deep animate-float"
        style={{
          width: '550px',
          height: '550px',
          bottom: '15%',
          left: '25%',
          opacity: 0.38,
          animationDelay: '10s',
        }}
      />
      <div
        className="aurora-blob aurora-blob-aqua animate-float"
        style={{
          width: '500px',
          height: '500px',
          bottom: '20%',
          right: '20%',
          opacity: 0.42,
          animationDelay: '7s',
        }}
      />
      <div
        className="aurora-blob aurora-blob-magenta animate-float"
        style={{
          width: '650px',
          height: '650px',
          top: '60%',
          left: '5%',
          opacity: 0.48,
          animationDelay: '3s',
        }}
      />

      {/* Grid veil — faint grid lines with radial mask */}
      <div className="grid-veil" />

      {/* Film grain texture */}
      <div className="film-grain" />

      {/* Darkening overlays for center legibility */}
      <div className="aurora-overlay" />
      <div
        className="aurora-overlay"
        style={{
          background: 'radial-gradient(ellipse at top, transparent 20%, var(--color-ink) 90%)',
        }}
      />
    </div>
  );
}
