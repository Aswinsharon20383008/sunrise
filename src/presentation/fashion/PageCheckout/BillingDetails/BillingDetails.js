import { computed, onMounted, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseAddressForm from '../../components/BaseAddressForm/BaseAddressForm.vue';
import { useStore } from 'vuex';
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
    BaseAddressForm,
  },
  setup(props, { emit }) {
    const { t } = useI18n({
      inheritLocale: true,
      useScope: 'local',
    });
    const differentAddress = shallowRef(false);
    const billingAddress = shallowRef(null);
    const shippingAddress = shallowRef(null);
    const store = useStore();
    const billingToJSON = computed(() => {
      return JSON.stringify(billingAddress.value);
    });
    const shippingToJSON = computed(() => {
      return JSON.stringify(shippingAddress.value);
    });
    const unsetBillingAddress = () => {
      return (billingAddress.value = null);
    };
    const updateBillingAddress = (address) => {
      billingAddress.value = address;
    };
    const updateShippingAddress = (address) => {
      shippingAddress.value = address;
    };
    const validBillingForm = (valid) => {
      store.dispatch('setBillingAddress', billingAddress.value);
      console.log("action dispatched", valid)
      store.dispatch('setValidBillingForm', valid);
      emit('valid-billing-form', valid);
    };
    const validShippingForm = (valid) => {
      console.log("valid shipp form", valid)
      store.dispatch('setValidShippingForm', valid);
      emit('valid-shipping-form', valid);
    };

    watch(() => (differentAddress), async () => {
      if (!differentAddress.value) {
        shippingAddress.value = billingAddress.value;
        store.dispatch('setValidShippingForm', true);
        validShippingForm(true);
      } else {
        validShippingForm(false);
      }
    }, { immediate: true });
    watch(() => {
      emit(
        'update-billing-details',
        billingAddress.value
      );
    }, { immediate: true });
    watch(() => {
      emit(
        'update-shipping-details',
        shippingAddress.value
      );
    }, { immediate: true });
    onMounted(async () => {//Todo:paypal
      validBillingForm(false);
    })

    return {
      t,
      billingToJSON,
      shippingToJSON,
      differentAddress,
      billingAddress,
      shippingAddress,
      unsetBillingAddress,
      updateBillingAddress,
      updateShippingAddress,
      validBillingForm,
      validShippingForm,
    };
  },
};
