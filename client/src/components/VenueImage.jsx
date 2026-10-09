import { useState } from 'react';

export default function VenueImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`venue-image-placeholder ${className}`} role="img" aria-label={alt}>
        <span aria-hidden="true">WP</span>
        <small>Venue photography</small>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
