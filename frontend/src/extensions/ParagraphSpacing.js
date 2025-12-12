import { Extension } from '@tiptap/core';

export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',
  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
      defaultSpacing: '0',
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          marginBottom: {
            default: null,
            parseHTML: element => element.style.marginBottom?.replace('px', ''),
            renderHTML: attributes => {
              if (!attributes.marginBottom) return {};
              return { style: `margin-bottom: ${attributes.marginBottom}px` };
            },
          },
          marginTop: {
            default: null,
            parseHTML: element => element.style.marginTop?.replace('px', ''),
            renderHTML: attributes => {
              if (!attributes.marginTop) return {};
              return { style: `margin-top: ${attributes.marginTop}px` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setMarginBottom: (size) => ({ commands }) => {
        return this.options.types.every(type => commands.updateAttributes(type, { marginBottom: size }));
      },
      setMarginTop: (size) => ({ commands }) => {
        return this.options.types.every(type => commands.updateAttributes(type, { marginTop: size }));
      },
    };
  },
});