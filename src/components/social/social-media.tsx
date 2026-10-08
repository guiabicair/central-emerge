const VIDEO_EXT = /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i;

export function isVideoUrl(url: string) {
  return VIDEO_EXT.test(url);
}

/** Arte do post: imagem ou vídeo (decidido pela extensão da URL). */
export function SocialMedia({
  src,
  className,
  controls = false,
}: {
  src: string;
  className?: string;
  controls?: boolean;
}) {
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
