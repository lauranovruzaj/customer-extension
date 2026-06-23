import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect} from "preact/hooks";
import {gqlFetch} from "./api.js";
import {EditAddressModal} from "./EditAddressModal.jsx";
import {CreateAddressModal} from "./CreateAddressModal.jsx";
import {EditProfileModal} from "./EditProfileModal.jsx";

export default async () => {
  render(<Extension />, document.body);
};

const CUSTOMER_QUERY = `query {
  customer {
    id
    firstName
    lastName
    emailAddress {
      emailAddress
    }
   
    defaultAddress {
      id
      country
      territoryCode
      phoneNumber
    }
    metafields(identifiers: [
      { namespace: "custom", key: "title" }
      { namespace: "custom", key: "date_of_birth" }
      { namespace: "custom", key: "preferred_communication_channel" }
      { namespace: "custom", key: "country_of_origin" }
    ]) {
      key
      value
    }
    addresses(first: 9) {
      edges {
        node {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          country
          zip
          phoneNumber
          territoryCode
          zoneCode
        }
      }
    }
    orders(first: 5) {
      edges {
        node {
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
  const [editingAddress, setEditingAddress] = useState(null);

  function fetchCustomer() {
    gqlFetch(CUSTOMER_QUERY)
      .then(json => {
        if (json.errors) console.error('Customer query errors:', JSON.stringify(json.errors));
        setCustomer(json.data?.customer ?? null);
        setLoading(false);
      })
      .catch(err => { console.error('Customer query failed:', err); setLoading(false); });
  }

  useEffect(() => { fetchCustomer(); }, []);

  const t = (key) => shopify.i18n.translate(key);

  const addresses = customer?.addresses?.edges?.map(e => e.node) ?? [];
  const orders = customer?.orders?.edges?.map(e => e.node) ?? [];


  if (loading) {
    return (
      <s-page heading={t('customProfilePage.title')}>
        <s-spinner accessibilityLabel={t('customProfilePage.loading')} />
      </s-page>
    );
  }

  return (
    <s-page heading={t('customProfilePage.title')}>

      <EditAddressModal editingAddress={editingAddress} onSuccess={fetchCustomer} />
      <CreateAddressModal onSuccess={fetchCustomer} />
      <EditProfileModal customer={customer} onSuccess={fetchCustomer} />

      <s-grid gridTemplateColumns="240px 1fr" gap="loose">

        {/* Sidebar */}
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
              <s-link commandFor="profile-edit-modal" command="--show">
                {t('customProfilePage.editProfile.title')}
              </s-link>
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
                      {address.id === customer.defaultAddress?.id && (
                        <s-badge tone="success">{t('customProfilePage.addressBook.default')}</s-badge>
                      )}
                      <s-icon type="location" size="base" />
                      <s-text type="strong">{address.firstName} {address.lastName}</s-text>
                      <s-text>{address.address1}</s-text>
                      <s-text>{address.city}</s-text>
                      <s-text>{address.country}</s-text>
                  
                      <s-link
                        commandFor="address-edit-modal"
                        command="--show"
                        onClick={() => setEditingAddress(address)}
                      >
                        {t('customProfilePage.addressBook.edit')}
                      </s-link>
                    </s-stack>
                  </s-box>
                ))}
              </s-grid>
            ) : (
              <s-text color="subdued">{t('customProfilePage.addressBook.empty')}</s-text>
            )}
            <s-box paddingBlockStart="base">
              <s-button commandFor="address-create-modal" command="--show" variant="secondary">
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
