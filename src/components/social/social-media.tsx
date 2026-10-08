const VIDEO_EXT = /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i;
const DRIVE_ID = /drive\.google\.com\/file\/d\/([\w-]+)/;

export function isVideoUrl(url: string) {
  return VIDEO_EXT.test(url);
}

export function driveFileId(url: string) {
  return url.match(DRIVE_ID)?.[1] ?? null;
}

/**
 * Arte do post. Arquivo do Drive: miniatura (ou o player do Drive com
 * `controls`, que serve pra imagem e vídeo). Arquivo do Storage: imagem ou
 * vídeo, decidido pela extensão da URL.
 */
export function SocialMedia({
  src,
  className,
  controls = false,
}: {
  src: string;
  className?: string;
  controls?: boolean;
}) {
  const driveId = driveFileId(src);
  if (driveId) {
    if (controls) {
      return (
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          className={className}
          allow="autoplay; fullscreen"
          title="Arte do post"
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://drive.google.com/thumbnail?id=${driveId}&sz=w800`}
        alt=""
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  }
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        controls={controls}
        muted={!controls}
        playsInline
        preload="metadata"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} />;
}

/** "reels_9_16" → [9, 16]. Sem proporção no nome: 4:5. */
export function formatRatio(format: string): [number, number] {
  const m = format.match(/_(\d+)_(\d+)$/);
  return m ? [Number(m[1]), Number(m[2])] : [4, 5];
}

/**
 * Arte/vídeo em tamanho de visualização: respeita a proporção do formato
 * (9:16 fica em pé, 16:9 deitado) e cabe na tela sem rolar.
 */
export function SocialMediaFrame({
  src,
  format,
  maxHeight = "70vh",
}: {
  src: string;
  format: string;
  maxHeight?: string;
}) {
  const [w, h] = formatRatio(format);
  return (
    <div
      className="mx-auto overflow-hidden rounded-lg bg-black"
      style={{
        aspectRatio: `${w} / ${h}`,
        width: `min(100%, calc(${maxHeight} * ${w} / ${h}))`,
      }}
    >
      <SocialMedia
        key={src}
        src={src}
        controls
        className="block h-full w-full border-0 object-contain"
      />
    </div>
  );
}
