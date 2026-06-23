import '@shopify/ui-extensions/preact';
import {render} from "preact";

export default async () => {
  render(<Extension />, document.body)
}

function Extension() {
  return (
    <s-banner>
      <s-text>
        {shopify.i18n.translate("profileMessage")}
      </s-text>
      <s-button href="extension:loyalty-extension">
        {shopify.i18n.translate("profileLoyaltyButton")}
      </s-button>
      <s-button href="extension:custom-profile-extension" variant="secondary">
        {shopify.i18n.translate("profileCustomPageButton")}
      </s-button>
    </s-banner>
  );
}
