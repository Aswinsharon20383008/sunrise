import { computed, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseAddressForm from '../../components/BaseAddressForm/BaseAddressForm.vue';
import { useStore } from 'vuex';
// import BaseForm from '../../components/BaseForm.vue';
export default {
  props: {
    billingAddress: {
      type: Object,
      required: false,
    },
    shippingAddress: {
      type: Object,
      required: false,
    },
  },
  components: {
    // BaseForm,
    BaseAddressForm,
  },
  setup(props, { emit }) {
    const { t } = useI18n({
      inheritLocale: true,
      useScope: 'local',
    });
    const differentAddress = shallowRef(false);
    const newBillingAddress = shallowRef(null);
    const newShippingAddress = shallowRef(null);
    const store = useStore();
    const billingToJSON = computed(() => {
      return JSON.stringify(newBillingAddress.value);
    });
    const shippingToJSON = computed(() => {
      return JSON.stringify(newShippingAddress.value);
    });
    const unsetBillingAddress = () => {
      return (newBillingAddress.value = null);
    };
    const updateBillingAddress = (address) => {
      newBillingAddress.value = address;
    };
    const updateShippingAddress = (address) => {
      newShippingAddress.value = address;
    };
    const validBillingForm = (valid) => {
      store.dispatch('setBillingAddress', newBillingAddress.value);
      store.dispatch('setValidBillingForm', valid);
      emit('valid-billing-form', valid);
    };
    const validShippingForm = (valid) => {
      store.dispatch('setValidShippingForm', valid);
      emit('valid-shipping-form', valid);
    };

    watch(() => {
      if (!differentAddress.value) {
        newShippingAddress.value = newBillingAddress.value;
        store.dispatch('setValidShippingForm', true);
        validShippingForm(true);
      } else {
        validShippingForm(false);
      }
    },{ immediate: true } );
    watch(() => {
      emit(
        'update-billing-details',
        newBillingAddress.value
      );
    },{ immediate: true } );
    watch(() => {
      emit(
        'update-shipping-details',
        newShippingAddress.value
      );
    },{ immediate: true } );

    return {
      t,
      billingToJSON,
      shippingToJSON,
      differentAddress,
      newBillingAddress,
      newShippingAddress,
      unsetBillingAddress,
      updateBillingAddress,
      updateShippingAddress,
      validBillingForm,
      validShippingForm,
    };
  },
};
