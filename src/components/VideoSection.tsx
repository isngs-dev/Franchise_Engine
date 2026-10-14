import { useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { SITE_VIDEO } from "../config";

function VideoPlayer() {
  const { src, poster, title } = SITE_VIDEO;
  const video = useRef<HTMLVideoElement>(null);
  const [cover, setCover] = useState(true); // thumbnail + play button visible
  const [starting, setStarting] = useState(false); // play requested, not yet playing

  const play = () => {
    const v = video.current;
    if (!v) return;
    if (v.ended) v.currentTime = 0;
    setStarting(true);
    v.play().catch(() => setStarting(false));
  };

  return (
    <div className="video">
      <video
        ref={video}
        src={encodeURI(src)}
        playsInline
        controls
        controlsList="nodownload"
        preload="none"
        aria-label={title}
        onPlaying={() => {
          setStarting(false);
          setCover(false);
        }}
        onEnded={() => setCover(true)}
      />

      <button
        type="button"
        className={`video__cover${cover ? "" : " is-hidden"}`}
        onClick={play}
        tabIndex={cover ? 0 : -1}
        aria-hidden={!cover}
        aria-label={`Play video: ${title}`}
      >
        <img src={poster} alt="" loading="lazy" decoding="async" width={1280} height={720} />
        <span className="video__play" aria-hidden="true">
          {starting ? <Loader2 className="spin" size={30} /> : <Play size={30} fill="currentColor" />}
        </span>
        <span className="video__label">{title}</span>
      </button>
    </div>
  );
}

export default function VideoSection() {
  const { eyebrow, heading, caption } = SITE_VIDEO;
  return (
    <section id="video" className="section section--tight" data-loop>
      <div className="container watch reveal">
        <div className="watch__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{heading}</h2>
          <p className="muted">{caption}</p>
        </div>
        <VideoPlayer />
      </div>
    </section>
  );
}
