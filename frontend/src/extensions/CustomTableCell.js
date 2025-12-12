import { TableCell } from '@tiptap/extension-table-cell';

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colWidth: {
        default: null,
        parseHTML: element => element.getAttribute('data-col-width'),
        renderHTML: attributes => ({
          'data-col-width': attributes.colWidth,
          style: attributes.colWidth ? `width: ${attributes.colWidth}` : '',
        }),
      },
    };
  },
});
