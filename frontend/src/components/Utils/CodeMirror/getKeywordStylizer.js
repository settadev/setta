import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, ViewPlugin } from "@codemirror/view";
import { useMemo } from "react";

const italicStyle = Decoration.mark({ class: "italic" });

function getKeywordStylizer(evRefs) {
  const keywordStylizer = ViewPlugin.fromClass(
    class {
      decorations;
      // Track positions separately from decorations so we can update them as the document changes
      positions;

      constructor(view) {
        // Make a copy of the initial positions to avoid modifying the original array
        this.positions = [...evRefs];
        this.decorations = this.buildDecorations(view);
      }

      update(update) {
        if (update.docChanged) {
          // Iterate through each change in the document
          update.changes.iterChanges((fromA, toA, fromB, toB) => {
            // Calculate how much the text length changed
            // (toB - fromB) is length of new text, (toA - fromA) is length of replaced text
            const delta = toB - fromB - (toA - fromA);

            // Update positions that come after the change
            this.positions = this.positions.map((pos) => {
              if (pos.startPos > fromA) {
                return {
                  ...pos,
                  startPos: pos.startPos + delta,
                };
              }
              return pos;
            });
          });

          // Rebuild decorations with the updated positions
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view) {
        const docLength = view.state.doc.length;
        const builder = new RangeSetBuilder();
        // Create a decoration for each tracked position
        for (const pos of this.positions) {
          // Skip if position would be out of range
          if (pos.startPos < 0 || pos.startPos >= docLength) continue;
          builder.add(
            pos.startPos,
            pos.startPos + pos.keyword.length,
            italicStyle,
          );
        }
        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );

  return keywordStylizer;
}

export function useKeywordStylizer(evRefs) {
  return useMemo(() => getKeywordStylizer(evRefs), [JSON.stringify(evRefs)]);
}
