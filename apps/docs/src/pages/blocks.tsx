import { VesselDetailBlock } from "../blocks/detail-page.tsx";
import detailSource from "../blocks/detail-page.tsx?raw";
import { VesselListBlock } from "../blocks/list-page.tsx";
import listSource from "../blocks/list-page.tsx?raw";
import { SettingsBlock } from "../blocks/settings.tsx";
import settingsSource from "../blocks/settings.tsx?raw";
import { SignInBlock } from "../blocks/sign-in.tsx";
import signInSource from "../blocks/sign-in.tsx?raw";
import { StatesBlock } from "../blocks/states.tsx";
import statesSource from "../blocks/states.tsx?raw";
import { BlockFrame } from "../docs/block-frame.tsx";
import { Page, Prose } from "../docs/kit.tsx";

export function BlocksPage() {
  return (
    <Page
      wide
      eyebrow="Start"
      title="Blocks"
      lead="Whole screens assembled from Nova UI components: copy one, then change the content. Every block follows the theme, mode, density, material and locale you set on the provider."
    >
      <Prose>
        <p>
          Blocks live in your app, not in the package: copy the code, rename things, and wire your data in. They use only public components, so they keep
          working across upgrades.
        </p>
      </Prose>
      <BlockFrame id="sign-in" title="Sign in" description="Email and password with inline validation, remember me, single sign-on and account recovery." source={signInSource}>
        <SignInBlock />
      </BlockFrame>
      <BlockFrame id="list" title="List page" description="Title and actions, then a searchable, sortable, paginated table with a column menu and a date filter in its toolbar." source={listSource}>
        <VesselListBlock />
      </BlockFrame>
      <BlockFrame id="detail" title="Detail page" description="Breadcrumbs, identity and actions, key figures, and tabbed activity, cargo and documents." source={detailSource}>
        <VesselDetailBlock />
      </BlockFrame>
      <BlockFrame id="settings" title="Settings" description="Grouped sections with their own save, switch rows with descriptions, and a separated danger zone." source={settingsSource}>
        <SettingsBlock />
      </BlockFrame>
      <BlockFrame id="states" title="Empty and error states" description="First use, no matches and a failed load, each offering a clear next step." source={statesSource}>
        <StatesBlock />
      </BlockFrame>
    </Page>
  );
}
