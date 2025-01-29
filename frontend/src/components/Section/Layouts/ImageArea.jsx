import _ from "lodash";
import React from "react";
import {
  useAllSectionArtifacts,
  useLoadArtifactViaDropzone,
} from "state/hooks/artifacts";
import { useImgArtifactAreaSize } from "state/hooks/sectionSizes";

function _ImageArea({ sectionId }) {
  const loadedArtifacts = useAllSectionArtifacts(sectionId, (x) =>
    _.pick(x, ["value"]),
  );
  const artifact = Object.values(loadedArtifacts)[0];
  const { getRootProps, isDragActive } = useLoadArtifactViaDropzone(
    sectionId,
    false,
    "img",
  );
  return (
    <figure
      className={`section-w-full section-row-main flex overflow-clip px-3 pb-1 pt-1 ${isDragActive ? "outline outline-4 outline-green-500 dark:outline-green-500/80" : ""}`}
      {...getRootProps()}
    >
      {!!artifact && (
        <ImageAreaCore sectionId={sectionId} image={artifact.value} />
      )}
    </figure>
  );
}

function ImageAreaCore({ sectionId, image }) {
  const imgSizeLoaded = useImgArtifactAreaSize(sectionId, image);

  return (
    imgSizeLoaded && (
      <img
        src={image.src}
        className="h-auto max-h-full w-full self-center object-contain"
      />
    )
  );
}

export const ImageArea = React.memo(_ImageArea);
