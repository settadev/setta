import _ from "lodash";
import React, { useEffect } from "react";
import { sendToInteractiveTasks } from "state/actions/interactive";
import {
  useAllSectionArtifacts,
  useLoadArtifactViaDropzone,
} from "state/hooks/artifacts";
import { useImgArtifactAreaSize } from "state/hooks/sectionSizes";
import { dataURLToBase64 } from "./DrawArea/base64Conversion";

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

  useEffect(() => {
    if (image?.src) {
      sendToInteractiveTasks([sectionId, "image"], dataURLToBase64(image.src));
    }
  }, [image?.src]);

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
