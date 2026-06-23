import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect} from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

const CUSTOMER_QUERY = `{
  customer {
    firstName
    lastName
    emailAddress {
      emailAddress
    }
    defaultAddress {
      country
    }
    addresses(first: 9) {
      nodes {
        id
        firstName
        lastName
        address1
        city
        zip
        country
      }
    }
    orders(first: 5) {
      nodes {
        id
        name
        processedAt
        financialStatus
        totalPrice {
          amount
          currencyCode
        }
      }
    }
  }
}`;

function extractId(gid) {
  return gid.split('/').pop();
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function Extension() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('shopify://customer-account/api/2026-04/graphql.json', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query: CUSTOMER_QUERY}),
    })
      .then(res => res.json())
      .then(({data}) => {
        setCustomer(data.customer);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const t = (key) => shopify.i18n.translate(key);

  if (loading) {
    return (
      <s-page heading={t('customProfilePage.title')}>
        <s-spinner accessibilityLabel={t('customProfilePage.loading')} />
      </s-page>
    );
  }

  const addresses = customer?.addresses?.nodes ?? [];
  const orders = customer?.orders?.nodes ?? [];

  return (
    <s-page heading={t('customProfilePage.title')}>
      <s-grid gridTemplateColumns="240px 1fr" gap="loose">

        {/* Sidebar navigation */}
        <s-box border="base" borderRadius="base">
          <s-stack direction="block" gap="none">
            <s-clickable href="extension:custom-profile-extension" padding="base" background="subdued">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="profile" size="base" />
                <s-text type="strong">{t('customProfilePage.nav.overview')}</s-text>
              </s-stack>
            </s-clickable>
            <s-divider />
            <s-clickable href="extension:loyalty-extension" padding="base">
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
            <s-clickable href="shopify:customer-account/orders" padding="base">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="orders" size="base" />
                <s-text>{t('customProfilePage.nav.orders')}</s-text>
              </s-stack>
            </s-clickable>
            <s-divider />
            <s-clickable padding="base">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="lock" size="base" />
                <s-text>{t('customProfilePage.nav.changePassword')}</s-text>
              </s-stack>
            </s-clickable>
            <s-divider />
            <s-clickable href="shopify:customer-account/logout" padding="base">
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-icon type="exit" size="base" tone="critical" />
                <s-text tone="critical">{t('customProfilePage.nav.logout')}</s-text>
              </s-stack>
            </s-clickable>
          </s-stack>
        </s-box>

        {/* Main content */}
        <s-stack direction="block" gap="loose">

          {/* Personal Information */}
          <s-section heading={t('customProfilePage.personalInfo.title')}>
            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-box>
                <s-text color="subdued">{t('customProfilePage.personalInfo.firstName')}</s-text>
                <s-text>{customer?.firstName ?? '—'}</s-text>
              </s-box>
              <s-box>
                <s-text color="subdued">{t('customProfilePage.personalInfo.lastName')}</s-text>
                <s-text>{customer?.lastName ?? '—'}</s-text>
              </s-box>
              <s-box>
                <s-text color="subdued">{t('customProfilePage.personalInfo.country')}</s-text>
                <s-text>{customer?.defaultAddress?.country ?? '—'}</s-text>
              </s-box>
              <s-box>
                <s-text color="subdued">{t('customProfilePage.personalInfo.email')}</s-text>
                <s-text>{customer?.emailAddress?.emailAddress ?? '—'}</s-text>
              </s-box>
            </s-grid>
            <s-box paddingBlockStart="base">
              <s-link href="shopify:customer-account/profile">{t('customProfilePage.viewAll')}</s-link>
            </s-box>
          </s-section>

          {/* Loyalty Program */}
          <s-section heading={t('customProfilePage.loyalty.title')}>
            <s-link href="extension:loyalty-extension">
              {t('customProfilePage.loyalty.viewDashboard')}
            </s-link>
          </s-section>

          {/* Address Book */}
          <s-section heading={t('customProfilePage.addressBook.title')}>
            {addresses.length > 0 ? (
              <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
                {addresses.map(address => (
                  <s-box key={address.id} border="base" borderRadius="base" padding="base">
                    <s-stack direction="block" gap="base" alignItems="center">
                      <s-icon type="location" size="base" />
                      <s-text type="strong">{address.firstName} {address.lastName}</s-text>
                      {address.address1 && <s-text>{address.address1}</s-text>}
                      {address.city && <s-text>{address.city} {address.zip}</s-text>}
                      <s-text>{address.country}</s-text>
                      <s-stack direction="inline" gap="base">
                        <s-link href={`shopify:customer-account/profile/addresses/${extractId(address.id)}/edit`}>
                          {t('customProfilePage.addressBook.edit')}
                        </s-link>
                        <s-link href={`shopify:customer-account/profile/addresses/${extractId(address.id)}/delete`} tone="critical">
                          {t('customProfilePage.addressBook.delete')}
                        </s-link>
                      </s-stack>
                    </s-stack>
                  </s-box>
                ))}
              </s-grid>
            ) : (
              <s-text color="subdued">{t('customProfilePage.addressBook.empty')}</s-text>
            )}
            <s-box paddingBlockStart="base">
              <s-button href="shopify:customer-account/profile/addresses/new" variant="secondary">
                {t('customProfilePage.addressBook.createNew')}
              </s-button>
            </s-box>
          </s-section>

          {/* My Orders */}
          <s-section heading={t('customProfilePage.orders.title')}>
            {orders.length > 0 ? (
              <s-stack direction="block" gap="none">
                <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="base">
                  <s-text color="subdued">{t('customProfilePage.orders.number')}</s-text>
                  <s-text color="subdued">{t('customProfilePage.orders.date')}</s-text>
                  <s-text color="subdued">{t('customProfilePage.orders.status')}</s-text>
                  <s-text color="subdued">{t('customProfilePage.orders.total')}</s-text>
                </s-grid>
                <s-divider />
                {orders.map(order => (
                  <s-box key={order.id} paddingBlock="base">
                    <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="base">
                      <s-link href={`shopify:customer-account/orders/${extractId(order.id)}`}>
                        {order.name}
                      </s-link>
                      <s-text>{formatDate(order.processedAt)}</s-text>
                      <s-text>{order.financialStatus}</s-text>
                      <s-text>{order.totalPrice.currencyCode} {parseFloat(order.totalPrice.amount).toFixed(2)}</s-text>
                    </s-grid>
                  </s-box>
                ))}
              </s-stack>
            ) : (
              <s-text color="subdued">{t('customProfilePage.orders.empty')}</s-text>
            )}
            <s-box paddingBlockStart="base">
              <s-link href="shopify:customer-account/orders">{t('customProfilePage.viewAll')}</s-link>
            </s-box>
          </s-section>

        </s-stack>
      </s-grid>
    </s-page>
  );
}
