import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect} from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

const API_URL = 'shopify://customer-account/api/2026-04/graphql.json';

const CUSTOMER_QUERY = `query {
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
      edges {
        node {
          id
          firstName
          lastName
          address1
          address2
          city
          zip
          zoneCode
          territoryCode
          province
          country
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

function gqlFetch(query, variables) {
  return fetch(API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables}),
  }).then(res => res.json());
}

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
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  function fetchCustomer() {
    gqlFetch(CUSTOMER_QUERY)
      .then(json => {
        setCustomer(json.data?.customer ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => { fetchCustomer(); }, []);

  const t = (key) => shopify.i18n.translate(key);

  function handleEditClick(address) {
    console.log('Full address object:', JSON.stringify(address));
    setFormError(null);
    setSaveSuccess(false);
    setEditingAddress(address);
    setFormData({
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      zip: address.zip || '',
      zoneCode: address.zoneCode || '',
      territoryCode: address.territoryCode || '',
    });
  }

  function field(key) {
    return (e) => setFormData(prev => ({...prev, [key]: e.target.value}));
  }

  async function saveAddress() {
    console.log('Saving address, formData:', JSON.stringify(formData));
    console.log('editingAddress.id:', editingAddress?.id);
    setSaving(true);
    setFormError(null);
    const json = await gqlFetch(
      `mutation updateAddress($addressId: ID!, $address: CustomerAddressInput!) {
        customerAddressUpdate(addressId: $addressId, address: $address) {
          customerAddress { id }
          userErrors { field message }
        }
      }`,
      {
        addressId: editingAddress.id,
        address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          zip: formData.zip,
          zoneCode: formData.zoneCode || undefined,
          territoryCode: formData.territoryCode || undefined,
        }
      }
    );
    console.log('Mutation response:', JSON.stringify(json));
    setSaving(false);
    const errors = json.data?.customerAddressUpdate?.userErrors;
    if (errors?.length) {
      setFormError(errors[0].message);
    } else if (json.errors?.length) {
      setFormError(json.errors[0].message);
    } else {
      setSaveSuccess(true);
      fetchCustomer();
    }
  }

  async function deleteAddress() {
    const json = await gqlFetch(
      `mutation deleteAddress($addressId: ID!) {
        customerAddressDelete(addressId: $addressId) {
          deletedAddressId
          userErrors { field message }
        }
      }`,
      {addressId: editingAddress.id}
    );
    const errors = json.data?.customerAddressDelete?.userErrors;
    if (!errors?.length) {
      setSaveSuccess(true);
      fetchCustomer();
    }
  }

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

      {/* Edit address modal — opened via commandFor, closed via command="--hide" */}
      <s-modal id="address-edit-modal" heading={t('customProfilePage.addressBook.editTitle')}>
        {saveSuccess ? (
          <s-stack direction="block" gap="base">
            <s-banner tone="success">
              <s-text>{t('customProfilePage.addressBook.form.success')}</s-text>
            </s-banner>
            <s-button commandFor="address-edit-modal" command="--hide">
              {t('customProfilePage.addressBook.form.close')}
            </s-button>
          </s-stack>
        ) : (
          <s-stack direction="block" gap="base" key={editingAddress?.id}>
            {formError && (
              <s-banner tone="critical">
                <s-text>{formError}</s-text>
              </s-banner>
            )}
            <s-text-field
              label={t('customProfilePage.addressBook.form.country')}
              name="territoryCode"
              value={formData.territoryCode}
              onInput={field('territoryCode')}
              helpText="ISO country code, e.g. IT, US, GB"
            />
            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-text-field
                label={t('customProfilePage.addressBook.form.firstName')}
                name="firstName"
                value={formData.firstName}
                onInput={field('firstName')}
              />
              <s-text-field
                label={t('customProfilePage.addressBook.form.lastName')}
                name="lastName"
                value={formData.lastName}
                onInput={field('lastName')}
              />
            </s-grid>
            <s-text-field
              label={t('customProfilePage.addressBook.form.address1')}
              name="address1"
              value={formData.address1}
              onInput={field('address1')}
            />
            <s-text-field
              label={t('customProfilePage.addressBook.form.address2')}
              name="address2"
              value={formData.address2}
              onInput={field('address2')}
            />
            <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
              <s-text-field
                label={t('customProfilePage.addressBook.form.zip')}
                name="zip"
                value={formData.zip}
                onInput={field('zip')}
              />
              <s-text-field
                label={t('customProfilePage.addressBook.form.city')}
                name="city"
                value={formData.city}
                onInput={field('city')}
              />
              <s-text-field
                label={t('customProfilePage.addressBook.form.province')}
                name="zoneCode"
                value={formData.zoneCode}
                onInput={field('zoneCode')}
                helpText="Province/state code, e.g. NA, CA, NY"
              />
            </s-grid>
            <s-grid gridTemplateColumns="1fr auto" gap="base">
              <s-box>
                <s-button tone="critical" onClick={deleteAddress}>
                  {t('customProfilePage.addressBook.delete')}
                </s-button>
              </s-box>
              <s-stack direction="inline" gap="base">
                <s-button commandFor="address-edit-modal" command="--hide">
                  {t('customProfilePage.addressBook.form.cancel')}
                </s-button>
                <s-button variant="primary" onClick={saveAddress} loading={saving}>
                  {t('customProfilePage.addressBook.form.save')}
                </s-button>
              </s-stack>
            </s-grid>
          </s-stack>
        )}
      </s-modal>

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
                      {address.address2 && <s-text>{address.address2}</s-text>}
                      {address.city && <s-text>{address.city} {address.zip}</s-text>}
                      <s-text>{address.country}</s-text>
                      <s-link
                        commandFor="address-edit-modal"
                        command="--show"
                        onClick={() => handleEditClick(address)}
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
