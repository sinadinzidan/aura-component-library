import { Button } from '@cognite/aura/components/button';
import { Kbd } from '@cognite/aura/components/kbd';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Topbar, TopbarCenter, TopbarLeft, TopbarRight, TopbarThemeSwitcher } from '@cognite/aura/components/topbar';
import { IconSearch } from '@cognite/aura/icons';

import { MANIFEST } from '../manifest';
import { useCatalogViewModel } from '../state/useCatalogViewModel';

const HOME_TAB = 'home';

type TopNavProps = { onSearch: () => void };

export function TopNav({ onSearch }: TopNavProps) {
  const { area, state, goHome, openArea, setTheme } = useCatalogViewModel();

  return (
    <Topbar>
      <TopbarLeft>
        <button
          type="button"
          onClick={goHome}
          className="rounded-md px-1 text-base font-semibold text-base-foreground outline-none focus-visible:shadow-focus-ring"
        >
          Aura Library
        </button>
      </TopbarLeft>
      <TopbarCenter>
        <Tabs
          value={area?.id ?? HOME_TAB}
          onValueChange={(value) => (value === HOME_TAB ? goHome() : openArea(String(value)))}
        >
          <TabsList size="small" showSeparator={false} aria-label="Library areas">
            <TabsTrigger value={HOME_TAB}>Home</TabsTrigger>
            {MANIFEST.map((entry) => (
              <TabsTrigger key={entry.id} value={entry.id}>
                {entry.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </TopbarCenter>
      <TopbarRight>
        <Button variant="outline" size="sm" onClick={onSearch}>
          <IconSearch /> Search <Kbd>/</Kbd>
        </Button>
        <TopbarThemeSwitcher theme={state.theme} onThemeChange={setTheme} />
      </TopbarRight>
    </Topbar>
  );
}
