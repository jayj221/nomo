/* eslint-disable @next/next/no-img-element */

interface Props {
  src?: string;
  size?: number;
}

// Anonymous by default. Photos appear only after a step-3 reveal,
// served as short-lived signed URLs.
export function Avatar({ src, size = 48 }: Props) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full border border-line bg-card"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-faint" style={{ fontSize: size / 3 }}>
          ·
        </span>
      )}
    </div>
  );
}
