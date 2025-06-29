import { createEffect, createSignal, onCleanup } from 'solid-js';
import { showDownloadsSheet, setShowDownloadsSheet } from '../renderer';

export const SideSheet = () => {
  const [ref, setRef] = createSignal<HTMLDivElement | undefined>(undefined);

  createEffect(() => {
    const active = showDownloadsSheet();
    const elem = ref();
    if (!active || !elem) return;

    const handler = (e: MouseEvent) => {
      const clickedOutside =
        !elem.isSameNode(e.target as Node) && !elem.contains(e.target as Node);
      if (clickedOutside) {
        setShowDownloadsSheet(false);
      }
    };

    document.addEventListener('click', handler);
    onCleanup(() => document.removeEventListener('click', handler));
  });

  return (
    <div
      ref={setRef}
      class={
        'ytmd-downloads-ui-side-sheet' + (showDownloadsSheet() ? ' active' : '')
      }
    ></div>
  );
};
