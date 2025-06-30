import { createEffect, For, onCleanup } from 'solid-js';
import { showDownloadsSheet, setShowDownloadsSheet } from '../renderer';
import { DownloadItem, type DownloadItemProps } from './DownloadItem';

const mockData: DownloadItemProps['item'][] = [
  {
    status: 'queued',
    title: 'Song 1',
    artist: 'Artist 1',
    album: 'Album 1',
    progress: 0,
  },
  {
    status: 'downloading',
    title: 'Song 2',
    artist: 'Artist 2',
    album: 'Album 2',
    progress: 50,
  },
  {
    status: 'completed',
    title: 'Song 3',
    artist: 'Artist 3',
    album: 'Album 3',
    progress: 100,
  },
  {
    status: 'failed',
    title: 'Song 4',
    artist: 'Artist 4',
    album: 'Album 4',
    progress: 10,
  },
];

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

  return (
    <>
      <ul
        style={{
          'margin-top': '4rem',
          'list-style-type': 'none',
          'width': '100%',
          'height': '100%',
          'display': 'flex',
          'flex-direction': 'column',
          'align-items': 'center',
          'gap': '2rem',
        }}
      >
        <For each={mockData}>
          {(data) => (
            <li
              style={{
                'height': '15%',
                'width': '95%',
                'font-size': '2rem',
              }}
            >
              <DownloadItem item={data} />
            </li>
          )}
        </For>
      </ul>
    </>
  );
};
