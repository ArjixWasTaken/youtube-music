import { createEffect, createSignal, For, Show } from 'solid-js';
import { allPlugins } from 'virtual:plugins';
import { plugins } from '../../renderer';
import { jaroWinkler } from '@skyra/jaro-winkler';

interface PluginCardProps {
  id: string;
  label: string;
  description: string;
  authors?: string[];
}

const PluginCard = (props: PluginCardProps) => {
  const [enabled, setEnabled] = createSignal<boolean | null>(null);
  plugins.isEnabled(props.id).then(setEnabled);

  const toggle = () => {
    const state = enabled();

    if (state === null) return;
    if (state) {
      plugins.disable(props.id);
      setEnabled(false);
    } else {
      plugins.enable(props.id);
      setEnabled(true);
    }
  };

  return (
    <div class="ytmd-sui-settingItem">
      <div class="ytmd-sui-pluginHeader">
        <div>
          <h4>{props.label}</h4>
          <Show when={Array.isArray(props.authors) && props.authors.length > 0}>
            <span class="ytmd-sui-pluginAuthor">
              by {props.authors!.join(', ')}
            </span>
          </Show>
        </div>
        <div
          class={`ytmd-sui-toggle ${enabled() ? 'active' : ''}`}
          tabIndex={1}
          onClick={toggle}
          onKeyUp={(e) => {
            e.preventDefault();
            if (e.key === 'Enter' || e.key === ' ') {
              toggle();
            }
          }}
        >
          <div class="ytmd-sui-toggleHandle"></div>
        </div>
      </div>
      <p class="ytmd-sui-pluginDescription">{props.description}</p>
    </div>
  );
};

// prettier-ignore
export default () => {
  const availablePlugins = Object.keys(allPlugins).sort((a, b) => a.localeCompare(b));

  const [query, setQuery] = createSignal('');
  const [filter, setFilter] = createSignal<'all' | 'enabled' | 'disabled'>('all');
  const [filteredPlugins, setFilteredPlugins] = createSignal<string[]>(availablePlugins);

  createEffect(async () => {
    // TODO: Throttle this effect so it doesn't run on every keystroke

    const search = query().trim().toLowerCase();
    const filter_ = filter();

    /*
      Note: it is safe to have the entire effect be async, because all the signals used in the effect are used before any await keyword.
      Due to how javascript behaves, an asynchornous function is only considered async after the first await keyword.
      If the signals were used after the await keyword, it would break the reactivity.
    */

    let filtered;

    if (filter_ === 'all') {
      filtered = Array.from(availablePlugins);
    } else {
      filtered = [];

      for (const plugin of availablePlugins) {
        const enabled = await plugins.isEnabled(plugin);

        if (filter_ === 'enabled' && enabled) {
          filtered.push(plugin);
        } else if (filter_ === 'disabled' && !enabled) {
          filtered.push(plugin);
        }
      }
    }

    if (search) {
      filtered = filtered.filter((plugin) => {
        const pluginInstance = allPlugins[plugin];

        const name = jaroWinkler(pluginInstance.name().toLowerCase(), search);
        const threshold = 0.85;

        return name >= threshold || pluginInstance.description?.()?.toLowerCase()?.includes(search);
      });
    }

      setFilteredPlugins(filtered);
  });

  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-pluginsFilters">
        <div class="ytmd-sui-pluginsSearch">
          <input
            type="text"
            class="ytmd-sui-input"
            onInput={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search plugins..."
          />
        </div>
        <div class="ytmd-sui-settingText">
          <div class="ytmd-sui-settingLabel">
            <span class="ytmd-sui-settingTitle">Show</span>
          </div>
          <select
            class="ytmd-sui-select"
            tabIndex={1}
            value="all"
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>
      <div class="ytmd-sui-pluginsSection">
        <For each={filteredPlugins()}>
          {(pluginId) => {
            const plugin = allPlugins[pluginId];
            return (
              <PluginCard
                id={pluginId}
                label={plugin.name()}
                description={plugin.description?.() ?? 'N/A'}
                authors={plugin.authors}
              />
            );
          }}
        </For>
      </div>
    </div>
  );
};
