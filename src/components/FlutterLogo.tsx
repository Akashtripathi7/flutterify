/** The Flutter logo mark (two-tone). Sized by `size` (px). */
export function FlutterLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 317"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M157.666 0L0 157.667l48.8 48.8L255.267 0H157.666zM156.4 145.2L72.067 229.533l48.866 49.134 48.734-48.734L256 144.267H156.4v.933z"
        fill="#47C5FB"
      />
      <path d="M120.933 278.667l37.067 37.066h97.6l-85.933-85.933-48.734 48.867z" fill="#00569E" />
      <path d="M71.667 229.467l48.8-48.8 48.866 48.8-48.8 48.866-48.866-48.866z" fill="#00B5F8" />
      <path
        d="M120.467 278.333l40.6-13.466-4.134-31.067-36.466 44.533z"
        fill="#00569E"
        fillOpacity="0.85"
      />
    </svg>
  );
}
