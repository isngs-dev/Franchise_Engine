/** The ISN logo (public/isn-logo.png). On dark backgrounds it sits on a white chip, as its letters are navy. */
export default function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`logo${light ? " logo--chip" : ""}`}>
      <img src="/isn-logo.png" alt="ISN" width={250} height={96} decoding="async" />
    </span>
  );
}
