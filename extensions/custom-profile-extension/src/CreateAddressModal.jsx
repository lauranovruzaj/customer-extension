import {useState} from "preact/hooks";
import {gqlFetch} from "./api.js";

const CREATE_MUTATION = `
  mutation createAddress($address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress { id }
      userErrors { field message }
    }
  }
`;

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  zip: '',
  territoryCode: '',
  zoneCode: '',
  phoneNumber: '',
  defaultAddress: false,
};

export function CreateAddressModal({ onSuccess }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const t = (key) => shopify.i18n.translate(key);

  function field(key) {
    return (e) => setFormData(prev => ({...prev, [key]: e.target.value}));
  }

  function resetForm() {
    setFormData(EMPTY_FORM);
    setFormError(null);
    setSaveSuccess(false);
  }

  async function createAddress() {
    setSaving(true);
    setFormError(null);
    const json = await gqlFetch(CREATE_MUTATION, {
      address: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.address1,
        address2: formData.address2 || undefined,
        city: formData.city,
        zip: formData.zip,
        zoneCode: formData.zoneCode || undefined,
        territoryCode: formData.territoryCode || undefined,
        phoneNumber: formData.phoneNumber || undefined,
      },
      defaultAddress: formData.defaultAddress,
    });
    setSaving(false);
    const errors = json.data?.customerAddressCreate?.userErrors;
    if (errors?.length) {
      setFormError(errors[0].message);
    } else if (json.errors?.length) {
      setFormError(json.errors[0].message);
    } else {
      setSaveSuccess(true);
      onSuccess();
    }
  }

  return (
    <s-modal
      id="address-create-modal"
      heading={t('customProfilePage.addressBook.addTitle')}
      onHide={resetForm}
    >
      {saveSuccess ? (
        <s-stack direction="block" gap="base">
          <s-banner tone="success">
            <s-text>{t('customProfilePage.addressBook.form.createSuccess')}</s-text>
          </s-banner>
          <s-button commandFor="address-create-modal" command="--hide">
            {t('customProfilePage.addressBook.form.close')}
          </s-button>
        </s-stack>
      ) : (
        <s-stack direction="block" gap="base">
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
            placeholder="e.g. IT, US, GB, FR"
            helpText={t('customProfilePage.addressBook.form.countryHelp')}
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
              placeholder="e.g. NA, CA, NY"
              helpText={t('customProfilePage.addressBook.form.provinceHelp')}
            />
          </s-grid>
          <s-checkbox
            label={t('customProfilePage.addressBook.form.setDefault')}
            name="defaultAddress"
            checked={formData.defaultAddress}
            onChange={(e) => setFormData(prev => ({...prev, defaultAddress: e.target.checked}))}
          />
          <s-stack direction="inline" gap="base" justifyContent="end">
            <s-button commandFor="address-create-modal" command="--hide">
              {t('customProfilePage.addressBook.form.cancel')}
            </s-button>
            <s-button variant="primary" onClick={createAddress} loading={saving}>
              {t('customProfilePage.addressBook.form.save')}
            </s-button>
          </s-stack>
        </s-stack>
      )}
    </s-modal>
  );
}
