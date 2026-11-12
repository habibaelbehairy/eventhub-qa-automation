import { defineSelectors } from '../../../utils/selectorDefinition';

// No root selector: messages (inline errors, toasts) can appear anywhere on the page, also outside <main>.
export default defineSelectors({
  elements: {
    byText: 'text="{text}"',
    byPartialText: 'text={text}',
  },
});
