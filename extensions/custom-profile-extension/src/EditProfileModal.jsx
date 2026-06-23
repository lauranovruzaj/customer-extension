import {useState, useEffect} from "preact/hooks";
import {gqlFetch} from "./api.js";
import {CountrySelect} from "./CountrySelect.jsx";
import {OriginCountrySelect} from "./OriginCountrySelect.jsx";

const SAVE_MUTATION = `
  mutation saveProfile($input: CustomerUpdateInput!, $metafields: [MetafieldsSetInput!]!) {
    customerUpdate(input: $input) {
      userErrors { field message }
    }
    metafieldsSet(metafields: $metafields) {
      userErrors { field message code }
    }
  }
`;

const ADDRESS_UPDATE_MUTATION = `
  mutation updateAddress($addressId: ID!, $address: CustomerAddressInput!) {
    customerAddressUpdate(addressId: $addressId, address: $address) {
      customerAddress { id }
      userErrors { field message }
    }
  }
`;

function getMetafield(customer, key) {
  return customer?.metafields?.find(m => m?.key === key)?.value || '';
}

export function EditProfileModal({ customer, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    dateOfBirth: '',
    territoryCode: '',
    phoneNumber: '',
    preferredCommunicationChannel: '',
    countryOfOrigin: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        title: getMetafield(customer, 'title'),
        dateOfBirth: getMetafield(customer, 'date_of_birth'),
        territoryCode: customer.defaultAddress?.territoryCode || '',
        phoneNumber: customer.defaultAddress?.phoneNumber || '',
        preferredCommunicationChannel: getMetafield(customer, 'preferred_communication_channel'),
        countryOfOrigin: getMetafield(customer, 'country_of_origin'),
      });
      setFormError(null);
      setSaveSuccess(false);
    }
  }, [customer?.id]);

  const t = (key) => shopify.i18n.translate(key);

  function field(key) {
    return (e) => setFormData(prev => ({...prev, [key]: e.target.value}));
  }

  async function saveProfile() {
    setSaving(true);
    setFormError(null);

    const metafields = [
      {
        ownerId: customer.id,
        namespace: 'custom',
        key: 'title',
        type: 'single_line_text_field',
        value: formData.title,
      },
      ...(formData.dateOfBirth ? [{
        ownerId: customer.id,
        namespace: 'custom',
        key: 'date_of_birth',
        type: 'date',
        value: formData.dateOfBirth,
      }] : []),
      {
        ownerId: customer.id,
        namespace: 'custom',
        key: 'preferred_communication_channel',
        type: 'single_line_text_field',
        value: formData.preferredCommunicationChannel,
      },
      {
        ownerId: customer.id,
        namespace: 'custom',
        key: 'country_of_origin',
        type: 'single_line_text_field',
        value: formData.countryOfOrigin,
      },
    ];

    const profileJson = await gqlFetch(SAVE_MUTATION, {
      input: {
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
      metafields,
    });

    const updateErrors = profileJson.data?.customerUpdate?.userErrors;
    const metafieldErrors = profileJson.data?.metafieldsSet?.userErrors;
    const topErrors = profileJson.errors;

    if (topErrors?.length) {
      setSaving(false);
      setFormError(topErrors[0].message);
      return;
    }
    if (updateErrors?.length) {
      setSaving(false);
      setFormError(updateErrors[0].message);
      return;
    }
    if (metafieldErrors?.length) {
      setSaving(false);
      setFormError(metafieldErrors[0].message);
      return;
    }

    if (customer.defaultAddress?.id) {
      const addressJson = await gqlFetch(ADDRESS_UPDATE_MUTATION, {
        addressId: customer.defaultAddress.id,
        address: {
          territoryCode: formData.territoryCode || undefined,
          phoneNumber: formData.phoneNumber || undefined,
        },
      });
      const addressErrors = addressJson.data?.customerAddressUpdate?.userErrors;
      if (addressErrors?.length) {
        setSaving(false);
        setFormError(addressErrors[0].message);
        return;
      }
    }

    setSaving(false);
    setSaveSuccess(true);
    onSuccess();
  }

  return (
    <s-modal id="profile-edit-modal" heading={t('customProfilePage.editProfile.title')}>
      {saveSuccess ? (
        <s-stack direction="block" gap="base">
          <s-banner tone="success">
            <s-text>{t('customProfilePage.editProfile.success')}</s-text>
          </s-banner>
          <s-button commandFor="profile-edit-modal" command="--hide">
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

          <s-select
            label={t('customProfilePage.editProfile.title_field')}
            value={formData.title}
            onChange={field('title')}
          >
            <s-option value="">—</s-option>
            <s-option value="Mr.">Mr.</s-option>
            <s-option value="Mrs.">Mrs.</s-option>
            <s-option value="Ms.">Ms.</s-option>
            <s-option value="Dr.">Dr.</s-option>
            <s-option value="Prof.">Prof.</s-option>
          </s-select>

          <s-grid gridTemplateColumns="1fr 1fr" gap="base">
            <s-text-field
              label={t('customProfilePage.personalInfo.firstName')}
              name="firstName"
              value={formData.firstName}
              onInput={field('firstName')}
            />
            <s-text-field
              label={t('customProfilePage.personalInfo.lastName')}
              name="lastName"
              value={formData.lastName}
              onInput={field('lastName')}
            />
          </s-grid>

          <s-date-field
            label={t('customProfilePage.editProfile.dateOfBirth')}
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({...prev, dateOfBirth: e.target.value}))}
          />

          <s-grid gridTemplateColumns="1fr 1fr" gap="base">
            <CountrySelect
              label={t('customProfilePage.personalInfo.country')}
              value={formData.territoryCode}
              onChange={(e) => setFormData(prev => ({...prev, territoryCode: e.target.value}))}
            />
            <s-text-field
              label={t('customProfilePage.editProfile.phoneNumber')}
              name="phoneNumber"
              value={formData.phoneNumber}
              onInput={field('phoneNumber')}
            />
          </s-grid>

          <s-grid gridTemplateColumns="1fr 1fr" gap="base">
            <s-select
              label={t('customProfilePage.editProfile.preferredCommunicationChannel')}
              value={formData.preferredCommunicationChannel}
              onChange={field('preferredCommunicationChannel')}
            >
              <s-option value="">—</s-option>
              <s-option value="email">Email</s-option>
              <s-option value="sms">SMS</s-option>
            </s-select>
            <OriginCountrySelect
              label={t('customProfilePage.editProfile.countryOfOrigin')}
              value={formData.countryOfOrigin}
              onChange={field('countryOfOrigin')}
            />
          </s-grid>

          <s-text-field
            label={t('customProfilePage.personalInfo.email')}
            value={customer?.emailAddress?.emailAddress || ''}
            readOnly
            helpText={t('customProfilePage.editProfile.emailHelp')}
          />

          <s-stack direction="inline" gap="base" justifyContent="end">
            <s-button commandFor="profile-edit-modal" command="--hide">
              {t('customProfilePage.addressBook.form.cancel')}
            </s-button>
            <s-button variant="primary" onClick={saveProfile} loading={saving}>
              {t('customProfilePage.addressBook.form.save')}
            </s-button>
          </s-stack>
        </s-stack>
      )}
    </s-modal>
  );
}
