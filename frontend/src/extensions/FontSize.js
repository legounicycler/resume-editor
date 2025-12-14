import { Extension } from '@tiptap/core';

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    // include node types where inline font-size is commonly placed
    return { types: ['textStyle', 'paragraph', 'heading', 'listItem', 'tableCell', 'tableHeader'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            // Parse HTML: Read style and strip 'pt' (and trailing semicolon), storing only the number
            parseHTML: element => {
              const size = (element.style && element.style.fontSize) || null;
              if (!size) return null;
              // Strip 'pt' and convert to number string
              return size.toString().trim().replace(/pt$/, '').replace(/;$/, '');
            },
            // Render HTML: Add 'pt' when rendering from the numeric value in PM state
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              const value = attributes.fontSize.toString().trim();
              // Ensure 'pt' is always added for numeric values
              return { style: `font-size: ${value}pt` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        // Command sets the numeric value directly, no 'pt' unit here
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});