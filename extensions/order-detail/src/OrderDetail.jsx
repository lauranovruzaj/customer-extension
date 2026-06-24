import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState, useEffect} from "preact/hooks";
import {gqlFetch} from "./api.js";

export default async () => {
  render(<Extension />, document.body);
};

const ORDER_QUERY = `
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      name
      processedAt
      financialStatus
      fulfillmentStatus
      subtotalPrice { amount currencyCode }
      totalShippingPrice { amount currencyCode }
      totalPrice { amount currencyCode }
      lineItems(first: 50) {
        edges {
          node {
            id
            title
            variantTitle
            quantity
            price { amount currencyCode }
          }
        }
      }
      shippingAddress {
        firstName
        lastName
        address1
        address2
        city
        zip
        country
      }
      billingAddress {
        firstName
        lastName
        address1
        address2
        city
        zip
        country
      }
      paymentInformation {
        paymentMethods {
          paymentDetails {
            __typename
            ... on CardPaymentDetails {
              cardBrand
              lastFourDigits
            }
          }
        }
      }
    }
  }
`;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatMoney(amount, currencyCode) {
  return `${currencyCode} ${parseFloat(amount).toFixed(2)}`;
}

function AddressBlock({ heading, address }) {
  if (!address) return null;
  return (
    <s-box border="base" borderRadius="base" padding="base">
      <s-stack direction="block" gap="small" alignItems="center">
        <s-text type="strong">{heading}</s-text>
        <s-text>{address.firstName} {address.lastName}</s-text>
        {address.address1 && <s-text>{address.address1}</s-text>}
        {address.address2 && <s-text>{address.address2}</s-text>}
        <s-text>{address.city} {address.zip}</s-text>
        <s-text>{address.country}</s-text>
      </s-stack>
    </s-box>
  );
}

function Extension() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const orderId = shopify.order?.value?.id;
    if (!orderId) {
      setError('Order not found.');
      setLoading(false);
      return;
    }
    gqlFetch(ORDER_QUERY, { id: orderId })
      .then(json => {
        if (json.errors) {
          console.error('Order query errors:', JSON.stringify(json.errors));
          setError(json.errors[0].message);
        } else {
          setOrder(json.data?.order ?? null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Order query failed:', err);
        setError('Failed to load order.');
        setLoading(false);
      });
  }, []);

  const t = (key) => shopify.i18n.translate(key);

  if (loading) {
    return (
      <s-page heading="">
        <s-spinner accessibilityLabel={t('customProfilePage.loading')} />
      </s-page>
    );
  }

  if (error || !order) {
    return (
      <s-page heading="">
        <s-banner tone="critical"><s-text>{error ?? 'Order not found.'}</s-text></s-banner>
      </s-page>
    );
  }

  const lineItems = order.lineItems?.edges?.map(e => e.node) ?? [];
  const payments = order.paymentInformation?.paymentMethods ?? [];

  return (
    <s-page heading={order.name}>

      {/* Back link */}
      <s-box paddingBlockEnd="base">
        <s-link href="extension:order-history/orders">
          {t('customProfilePage.orders.title')}
        </s-link>
      </s-box>

      {/* ORDER HISTORY + summary */}
      <s-stack direction="block" gap="loose">
        <s-text type="heading">{t('customProfilePage.orders.history')}</s-text>

        <s-grid gridTemplateColumns="1fr 320px" gap="loose" alignItems="start">

          {/* Line items table */}
          <s-stack direction="block" gap="none">
            <s-grid gridTemplateColumns="1fr 120px 120px" gap="base">
              <s-text color="subdued">{t('customProfilePage.orders.product')}</s-text>
              <s-text color="subdued">{t('customProfilePage.orders.quantity')}</s-text>
              <s-text color="subdued">{t('customProfilePage.orders.price')}</s-text>
            </s-grid>
            <s-divider />
            {lineItems.map(item => (
              <s-box key={item.id} paddingBlock="base">
                <s-grid gridTemplateColumns="1fr 120px 120px" gap="base" alignItems="center">
                  <s-stack direction="block" gap="none">
                    <s-text type="strong">{item.title}</s-text>
                    {item.variantTitle && <s-text color="subdued">{item.variantTitle}</s-text>}
                  </s-stack>
                  <s-text>{item.quantity}</s-text>
                  <s-text>{formatMoney(item.price.amount, item.price.currencyCode)}</s-text>
                </s-grid>
                <s-divider />
              </s-box>
            ))}
          </s-stack>

          {/* Order summary box */}
          <s-box background="subdued" borderRadius="base" padding="base">
            <s-stack direction="block" gap="none">
              <s-box paddingBlock="base">
                <s-grid gridTemplateColumns="1fr auto">
                  <s-text color="subdued">{t('customProfilePage.orders.orderDate')}</s-text>
                  <s-text>{formatDate(order.processedAt)}</s-text>
                </s-grid>
              </s-box>
              <s-divider />
              <s-box paddingBlock="base">
                <s-grid gridTemplateColumns="1fr auto">
                  <s-text color="subdued">{t('customProfilePage.orders.status')}</s-text>
                  <s-text type="strong">{order.financialStatus}</s-text>
                </s-grid>
              </s-box>
              <s-divider />
              <s-box paddingBlock="base">
                <s-grid gridTemplateColumns="1fr auto">
                  <s-text color="subdued">{t('customProfilePage.orders.products')}</s-text>
                  <s-text>{formatMoney(order.subtotalPrice.amount, order.subtotalPrice.currencyCode)}</s-text>
                </s-grid>
              </s-box>
              <s-divider />
              <s-box paddingBlock="base">
                <s-grid gridTemplateColumns="1fr auto">
                  <s-text color="subdued">{t('customProfilePage.orders.shipping')}</s-text>
                  <s-text>{formatMoney(order.totalShippingPrice.amount, order.totalShippingPrice.currencyCode)}</s-text>
                </s-grid>
              </s-box>
              <s-divider />
              <s-box paddingBlockStart="base">
                <s-grid gridTemplateColumns="1fr auto">
                  <s-text type="strong">{t('customProfilePage.orders.total')}</s-text>
                  <s-text type="strong">{formatMoney(order.totalPrice.amount, order.totalPrice.currencyCode)}</s-text>
                </s-grid>
              </s-box>
            </s-stack>
          </s-box>

        </s-grid>

        {/* Customer information */}
        <s-stack direction="block" gap="base">
          <s-text type="heading">{t('customProfilePage.orders.customerInfo')}</s-text>
          <s-grid gridTemplateColumns="1fr 1fr" gap="base">
            <AddressBlock
              heading={t('customProfilePage.orders.shippingInfo')}
              address={order.shippingAddress}
            />
            <AddressBlock
              heading={t('customProfilePage.orders.billingInfo')}
              address={order.billingAddress}
            />
          </s-grid>

          {payments.length > 0 && (
            <s-box border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small" alignItems="center">
                <s-text type="strong">{t('customProfilePage.orders.payment')}</s-text>
                {payments.map((pm, i) => {
                  const details = pm.paymentDetails;
                  if (details?.__typename === 'CardPaymentDetails') {
                    return (
                      <s-text key={i}>{details.cardBrand} •••• {details.lastFourDigits}</s-text>
                    );
                  }
                  return null;
                })}
              </s-stack>
            </s-box>
          )}
        </s-stack>

      </s-stack>
    </s-page>
  );
}
