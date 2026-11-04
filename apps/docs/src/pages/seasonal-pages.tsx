import { NowruzPageBlock } from "../blocks/nowruz-page.tsx";
import nowruzSource from "../blocks/nowruz-page.tsx?raw";
import { YaldaPageBlock } from "../blocks/yalda-page.tsx";
import yaldaSource from "../blocks/yalda-page.tsx?raw";
import { BlockFrame } from "../docs/block-frame.tsx";
import { Page, Prose } from "../docs/kit.tsx";

export function SeasonalPagesPage() {
  return (
    <Page
      wide
      eyebrow="Start"
      title="Seasonal pages"
      lead="Two complete Kaveh campaign pages, one for Yalda Night and one for Nowruz, built from the kaveh-yalda and kaveh-nowruz presets and the Kaveh kit."
    >
      <Prose>
        <p>
          Each page brings its own theme provider: Yalda is dark-first on the night sky, Nowruz is light-first in spring green. Both keep the Kaveh rule: navy
          for structure and text, Kaveh orange for actions. Copy one into your app and change the dates, copy and links.
        </p>
      </Prose>
      <BlockFrame
        id="yalda"
        title="Yalda Night"
        description="The greeting banner, a holiday-hours notice, the Yalda table, winter services, the holiday timeline with a fal-e Hafez, and the footer."
        source={yaldaSource}
      >
        <YaldaPageBlock />
      </BlockFrame>
      <BlockFrame
        id="nowruz"
        title="Nowruz"
        description="The spring greeting, holiday operations, the Haft-Seen table, new-year services, the holiday timeline through Sizdah Bedar with a verse by Saadi, and the footer."
        source={nowruzSource}
      >
        <NowruzPageBlock />
      </BlockFrame>
    </Page>
  );
}
