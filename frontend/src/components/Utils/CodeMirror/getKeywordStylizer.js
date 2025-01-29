import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, ViewPlugin } from "@codemirror/view";

const italicStyle = Decoration.mark({ class: "italic" });

export function getKeywordStylizer(evRefs) {
  const keywordStylizer = ViewPlugin.fromClass(
    class {
      decorations;
      // Track positions separately from decorations so we can update them as the document changes
      positions;

      constructor() {
        // Make a copy of the initial positions to avoid modifying the original array
        this.positions = [...evRefs];
        this.decorations = this.buildDecorations();
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
          this.decorations = this.buildDecorations();
        }
      }

      buildDecorations() {
        const builder = new RangeSetBuilder();
        // Create a decoration for each tracked position
        for (const pos of this.positions) {
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
