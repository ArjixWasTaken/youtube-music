import { createEffect, onCleanup } from 'solid-js';
import { showDownloadsSheet, setShowDownloadsSheet } from '../renderer';

export const SideSheet = () => {
  createEffect(() => {
    const active = showDownloadsSheet();
    if (!active) return;

    const selector = '.ytmd-downloads-ui-side-sheet';
    const elem = document.querySelector<HTMLElement>(selector);
    if (!elem) return;

    // TODO: Ignore clicks on overlays

    const handler = (e: MouseEvent) => {
      const isSelf = elem.isSameNode(e.target as Node);
      const isWithin = elem.contains(e.target as Node);

      if (!isSelf && !isWithin) {
        setShowDownloadsSheet(false);
      }
    };

    document.addEventListener('click', handler);
    onCleanup(() => document.removeEventListener('click', handler));
  });

  return <></>;
};
