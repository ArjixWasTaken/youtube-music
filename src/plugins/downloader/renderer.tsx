/// <reference types="vite/client" />

import downloadHTML from './templates/download.html?raw';

import defaultConfig from '@/config/defaults';
import { getSongMenu } from '@/providers/dom-elements';
import { getSongInfo } from '@/providers/song-info-front';

import { createRenderer, LoggerPrefix } from '@/utils';

import { t } from '@/i18n';

import { defaultTrustedTypePolicy } from '@/utils/trusted-types';

import { ElementFromHtml } from '../utils/renderer';

import type { RendererContext } from '@/types/contexts';

import type { DownloaderPluginConfig } from './index';
import { waitForElement } from '@/utils/wait-for-element';
import { Portal, render } from 'solid-js/web';
import { createEffect, createSignal, Show } from 'solid-js';
import { SideSheet } from './components';

let menu: Element | null = null;
let progress: Element | null = null;
const downloadButton = ElementFromHtml(downloadHTML);

let doneFirstLoad = false;

const menuObserver = new MutationObserver(() => {
  if (!menu) {
    menu = getSongMenu();
    if (!menu) {
      return;
    }
  }

  if (menu.contains(downloadButton)) {
    return;
  }

  // check for video (or music)
  let menuUrl = document.querySelector<HTMLAnchorElement>(
    'tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint'
  )?.href;
  if (!menuUrl?.includes('watch?')) {
    menuUrl = undefined;
    // check for podcast
    for (const it of document.querySelectorAll(
      'tp-yt-paper-listbox [tabindex="-1"] #navigation-endpoint'
    )) {
      if (it.getAttribute('href')?.includes('podcast/')) {
        menuUrl = it.getAttribute('href')!;
        break;
      }
    }
  }

  if (!menuUrl && doneFirstLoad) {
    return;
  }

  menu.prepend(downloadButton);
  progress = document.querySelector('#ytmcustom-download');

  if (!doneFirstLoad) {
    setTimeout(() => (doneFirstLoad ||= true), 500);
  }
});

let _ipc: RendererContext<DownloaderPluginConfig>['ipc'] | null = null;
window.download = () => {
  if (!_ipc) return;

  const songMenu = getSongMenu();
  let videoUrl = songMenu
    // Selector of first button which is always "Start Radio"
    ?.querySelector(
      'ytmusic-menu-navigation-item-renderer[tabindex="0"] #navigation-endpoint'
    )
    ?.getAttribute('href');

  if (!videoUrl && songMenu) {
    for (const it of songMenu.querySelectorAll(
      'ytmusic-menu-navigation-item-renderer[tabindex="-1"] #navigation-endpoint'
    )) {
      if (it.getAttribute('href')?.includes('podcast/')) {
        videoUrl = it.getAttribute('href');
        break;
      }
    }
  }

  if (videoUrl) {
    if (videoUrl.startsWith('watch?')) {
      videoUrl = defaultConfig.url + '/' + videoUrl;
    }

    if (videoUrl.startsWith('podcast/')) {
      videoUrl =
        defaultConfig.url + '/watch?' + videoUrl.replace('podcast/', 'v=');
    }

    if (videoUrl.includes('?playlist=')) {
      _ipc.invoke('download-playlist-request', videoUrl);
      return;
    }
  } else {
    videoUrl = getSongInfo().url || window.location.href;
  }

  _ipc.invoke('download-song', videoUrl);
};

export const [showDownloadsSheet, setShowDownloadsSheet] = createSignal(false);
const DownloadsButton = () => {
  return (
    <div
      class={
        'ytmd-downloads-ui-btn-content' +
        (showDownloadsSheet() ? ' active' : '')
      }
      on:click={(e) => {
        e.stopPropagation();
        setShowDownloadsSheet((old) => !old);
      }}
    >
      <yt-icon icon="yt-icons:offline_download" tabindex="0" />
      <div class="title-column style-scope ytmusic-guide-entry-renderer">
        <div class="title-group style-scope ytmusic-guide-entry-renderer">
          <yt-formatted-string
            class="title style-scope ytmusic-guide-entry-renderer"
            text={{ runs: [{ text: t('plugins.downloader.button') }] }}
          />
        </div>
      </div>
    </div>
  );
};

const cleanup: Record<string, () => void> = {};
const dispose = () => {
  for (const key in cleanup) {
    cleanup[key]();
    waitForElement<HTMLElement>(`#${key}`).then(injectButton);
  }
};

// prettier-ignore
const injectButton = async (guide: HTMLElement) => {
  const items = guide.querySelector(
    "ytmusic-guide-section-renderer[is-primary] > #items",
  );
  if (!items) return;

  // dispose of the previous button
  cleanup[guide.id]?.();

  const entry = document.createElement("div");
  {
    const isMini = guide.id.startsWith("mini-");

    entry.classList.add("ytmd-downloads-ui-btn");
    entry.classList.add(isMini ? "mini" : "normal");

    items.appendChild(entry);
  }

  const dispose = render(DownloadsButton, entry);
  cleanup[guide.id] = () => {
    dispose();
    entry.remove()
  };
};

const injectSheet = (container: HTMLElement) => {
  cleanup[container.id]?.();
  const dispose = render(SideSheet, container);

  cleanup[container.id] = dispose;
};

export const renderer = createRenderer({
  async start({ ipc }) {
    _ipc = ipc;

    ipc.on('downloader-feedback', (feedback: string) => {
      if (progress) {
        const targetHtml = feedback || t('plugins.downloader.templates.button');
        (progress.innerHTML as string | TrustedHTML) = defaultTrustedTypePolicy
          ? defaultTrustedTypePolicy.createHTML(targetHtml)
          : targetHtml;
      } else {
        console.warn(
          LoggerPrefix,
          t('plugins.downloader.renderer.can-not-update-progress')
        );
      }
    });

    waitForElement<HTMLElement>('#guide-renderer').then(injectButton);
    waitForElement<HTMLElement>('#mini-guide-renderer').then(injectButton);
    waitForElement<HTMLElement>('#content-wrapper').then(injectSheet);
  },
  async stop() {
    _ipc = null;
  },

  onPlayerApiReady() {
    menuObserver.observe(document.querySelector('ytmusic-popup-container')!, {
      childList: true,
      subtree: true,
    });
  },
});

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
