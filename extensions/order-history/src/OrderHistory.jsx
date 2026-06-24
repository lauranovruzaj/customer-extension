import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect} from "preact/hooks";
import {gqlFetch} from "./api.js";

export default async () => {
  render(<Extension />, document.body);
};

const ORDERS_QUERY = `query {
  customer {
    orders(first: 50) {
      edges {
        node {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
}`;

function extractId(gid) {
  return gid.split('/').pop();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function Extension() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gqlFetch(ORDERS_QUERY)
      .then(json => {
        if (json.errors) console.error('Orders query errors:', JSON.stringify(json.errors));
        setOrders(json.data?.customer?.orders?.edges?.map(e => e.node) ?? []);
        setLoading(false);
      })
      .catch(err => { console.error('Orders query failed:', err); setLoading(false); });
  }, []);

  const t = (key) => shopify.i18n.translate(key);

  if (loading) {
    return (
      <s-page heading={t('customProfilePage.orders.title')}>
        <s-spinner accessibilityLabel={t('customProfilePage.loading')} />
      </s-page>
    );
  }

  return (
    <s-page heading={t('customProfilePage.orders.title')}>
      <s-grid gridTemplateColumns="240px 1fr" gap="loose">

        {/* Sidebar */}
        <s-box border="base" borderRadius="base">
          <s-stack direction="block" gap="none">
            <s-clickable href="extension:account-overview/custom-profile" padding="base">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="profile" size="base" />
                <s-text>{t('customProfilePage.nav.overview')}</s-text>
              </s-stack>
            </s-clickable>
            <s-divider />
            <s-clickable href="extension:loyalty" padding="base">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="gift" size="base" />
                <s-text>{t('customProfilePage.nav.loyalty')}</s-text>
              </s-stack>
            </s-clickable>
            <s-divider />
            <s-clickable href="shopify:customer-account/profile" padding="base">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="profile" size="base" />
                <s-text>{t('customProfilePage.nav.personalInfo')}</s-text>
              </s-stack>
            </s-clickable>
            <s-divider />
            <s-clickable href="extension:order-history/orders" padding="base" background="subdued">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="orders" size="base" />
                <s-text type="strong">{t('customProfilePage.nav.orders')}</s-text>
              </s-stack>
            </s-clickable>
            <s-divider />
            <s-clickable
              padding="base"
              onClick={() => shopify.navigation.navigate(`${shopify.shop.storefrontUrl}/account/logout`)}
            >
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="exit" size="base" tone="critical" />
                <s-text tone="critical">{t('customProfilePage.nav.logout')}</s-text>
              </s-stack>
            </s-clickable>
          </s-stack>
        </s-box>

        {/* Orders table */}
        <s-stack direction="block" gap="base">
          <s-text type="heading">{t('customProfilePage.orders.title')}</s-text>

          {orders.length > 0 ? (
            <s-stack direction="block" gap="none">
              {/* Header row */}
              <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="base">
                <s-text color="subdued">{t('customProfilePage.orders.number')}</s-text>
                <s-text color="subdued">{t('customProfilePage.orders.date')}</s-text>
                <s-text color="subdued">{t('customProfilePage.orders.status')}</s-text>
                <s-text color="subdued">{t('customProfilePage.orders.total')}</s-text>
              </s-grid>
              <s-divider />

              {orders.map(order => (
                <s-box key={order.id} paddingBlock="base">
                  <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="base" alignItems="center">
                    <s-link href={`extension:order-detail/customer-account.order.page.render/${extractId(order.id)}`}>
                      {order.name}
                    </s-link>
                    <s-text>{formatDate(order.processedAt)}</s-text>
                    <s-text>{order.financialStatus}</s-text>
                    <s-text>
                      {order.totalPrice.currencyCode} {parseFloat(order.totalPrice.amount).toFixed(2)}
                    </s-text>
                  </s-grid>
                  <s-divider />
                </s-box>
              ))}
            </s-stack>
          ) : (
            <s-text color="subdued">{t('customProfilePage.orders.empty')}</s-text>
          )}
        </s-stack>

      </s-grid>
    </s-page>
  );
}
