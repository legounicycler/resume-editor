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
            // keep units if present, strip trailing semicolons and whitespace
            parseHTML: element => {
              const size = (element.style && element.style.fontSize) || null;
              if (!size) return null;
              return size.toString().trim().replace(/;$/, '');
            },
            // when rendering, if the stored value is numeric-only append 'pt'
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              const v = attributes.fontSize.toString().trim();
              const value = /^\d+(\.\d+)?$/.test(v) ? `${v}pt` : v;
              return { style: `font-size: ${value}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});