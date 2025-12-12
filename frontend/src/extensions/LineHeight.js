import { Extension } from '@tiptap/core';

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      defaultHeight: '1.0',
    };
  },

  addGlobalAttributes(){
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (attributes.lineHeight === null || attributes.lineHeight === undefined) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight) => ({ editor, commands }) => {
        // Get the actual node type currently selected
        const { $from } = editor.state.selection;
        const nodeType = $from.node().type.name;
        
        // Only update the current node's type
        if (this.options.types.includes(nodeType)) {
          return commands.updateAttributes(nodeType, { lineHeight });
        }
        
        // Fallback to paragraph if not in our types list
        return commands.updateAttributes('paragraph', { lineHeight });
      },
    };
  },
});