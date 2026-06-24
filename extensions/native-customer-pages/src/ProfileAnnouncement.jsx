import '@shopify/ui-extensions/preact';
import {render} from "preact";

export default async () => {
  render(<Extension />, document.body)
}

function Extension() {
  return (
    <s-announcement>
      <s-stack direction="inline" gap="base">
        <s-text>{shopify.i18n.translate("profileAnnouncement.message")}</s-text>
        <s-link href="shopify:customer-account/profile">
          {shopify.i18n.translate("profileAnnouncement.link")}
        </s-link>
      </s-stack>
    </s-announcement>
  );
}
