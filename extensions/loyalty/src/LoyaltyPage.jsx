import '@shopify/ui-extensions/preact';
import {render} from "preact";

export default async () => {
  render(<Extension />, document.body)
}

function Extension() {
  return (
    <s-box padding="base">
      <s-heading>{shopify.i18n.translate("loyaltyPage.title")}</s-heading>
      <s-box paddingBlockStart="base">
        <s-text>{shopify.i18n.translate("loyaltyPage.description")}</s-text>
      </s-box>
    </s-box>
  );
}
