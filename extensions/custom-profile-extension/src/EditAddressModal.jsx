import {useState, useEffect} from "preact/hooks";
import {gqlFetch} from "./api.js";

const UPDATE_MUTATION = `
  mutation updateAddress($addressId: ID!, $address: CustomerAddressInput!) {
    customerAddressUpdate(addressId: $addressId, address: $address) {
      customerAddress { id }
      userErrors { field message }
    }
  }
`;

const DELETE_MUTATION = `
  mutation deleteAddress($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors { field message }
    }
  }
`;

export function EditAddressModal({ editingAddress, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    
    if (editingAddress) {
      setFormData({
        firstName: editingAddress.firstName || '',
        lastName: editingAddress.lastName || '',
         company: editingAddress.company || '',
        address1: editingAddress.address1 || '',
        address2: editingAddress.address2 || '',
        city: editingAddress.city || '',
        territoryCode:  editingAddress.territoryCode || '',
        zoneCode:  editingAddress.zoneCode || '',
        zip: editingAddress.zip || '',
        phoneNumber: editingAddress.phoneNumber || '',
    
      });
      setFormError(null);
      setSaveSuccess(false);
    }
  }, [editingAddress?.id]);

  const t = (key) => shopify.i18n.translate(key);

  function field(key) {
    return (e) => setFormData(prev => ({...prev, [key]: e.target.value}));
  }

  async function saveAddress() {
    setSaving(true);
    setFormError(null);
    const json = await gqlFetch(UPDATE_MUTATION, {
      addressId: editingAddress.id,
      address: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        zoneCode: formData.zoneCode || undefined,
        territoryCode: formData.territoryCode || undefined,
        zip: formData.zip,
        phoneNumber: formData.phoneNumber
      },
    });
    setSaving(false);
    const errors = json.data?.customerAddressUpdate?.userErrors;
    if (errors?.length) {
      setFormError(errors[0].message);
    } else if (json.errors?.length) {
      setFormError(json.errors[0].message);
    } else {
      setSaveSuccess(true);
      onSuccess();
    }
  }

  async function deleteAddress() {
    const json = await gqlFetch(DELETE_MUTATION, { addressId: editingAddress.id });
    const errors = json.data?.customerAddressDelete?.userErrors;
    if (errors?.length) {
      setFormError(errors[0].message);
    } else {
      setSaveSuccess(true);
      onSuccess();
    }
  }

  return (
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
           <s-text-field
              label={t('customProfilePage.addressBook.form.province')}
              name="zoneCode"
              value={formData.zoneCode}
              onInput={field('zoneCode')}
              helpText="Province/state code, e.g. NA, CA, NY"
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
             <s-text-field
              label={t('customProfilePage.addressBook.form.company')}
              name="company"
              value={formData.company}
              onInput={field('company')}
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
              label={t('customProfilePage.addressBook.form.phone')}
              name="phoneNumber"
              value={formData.phoneNumber}
              onInput={field('phoneNumber')}
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
  );
}
