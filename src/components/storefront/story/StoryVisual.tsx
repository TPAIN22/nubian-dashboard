/**
 * The story's media slot: one component, two backing media types.
 *
 * Today every chapter resolves to the image path, because the repository has
 * no footage — see `public/story/ASSETS.md`. The video path is real,
 * exercised code rather than a stub, so dropping a file at the documented
 * location and passing `video` is the entire integration.
 *
 * The split matters for cost. The image path is a **server component**: it
 * renders `StoreImage` and ships no JavaScript, which is why the homepage's
 * client bundle is unchanged by the whole narrative. The client island below
 * is imported only when a `video` prop is actually supplied, so the current
 * page never pays for it.
 */

import { StoreImage } from "../StoreImage";
import { StoryVideo } from "./StoryVideo";

export interface StoryVisualProps {
  /** Poster/fallback still. Required — video never renders without one. */
  image: string | null;
  alt: string;
  /**
   * Optional local video. Must be a path under `public/`, never a remote URL:
   * a brand film that depends on a third-party host is one outage away from
   * an empty hero.
   */
  video?: { src: string; type?: string };
  className?: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  transformWidth?: number;
  quality?: number;
  fit?: "cover" | "contain";
  /**
   * Apply the campaign grade (`.sf-grade`). For licensed campaign stills
   * only — product photography is never graded.
   */
  grade?: boolean;
  objectPosition?: string;
}

export function StoryVisual({
  image,
  alt,
  video,
  className,
  imageClassName,
  sizes,
  priority = false,
  transformWidth,
  quality,
  fit = "cover",
  grade = false,
  objectPosition,
}: StoryVisualProps) {
  const media = renderMedia();
  return grade ? <div className={`sf-grade ${className ?? ""}`}>{media}</div> : media;

  function renderMedia() {
  if (video && image) {
    return (
      <StoryVideo
        src={video.src}
        type={video.type ?? "video/mp4"}
        poster={image}
        alt={alt}
        className={className}
        priority={priority}
      />
    );
  }

  return (
    <StoreImage
      src={image}
      alt={alt}
      className={className}
      imageClassName={imageClassName}
      sizes={sizes}
      priority={priority}
      transformWidth={transformWidth}
      quality={quality}
      fit={fit}
      objectPosition={objectPosition}
    />
  );
  }
}
