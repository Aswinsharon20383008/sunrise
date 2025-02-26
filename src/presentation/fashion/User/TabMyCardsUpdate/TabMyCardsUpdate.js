/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import customer from '../../../fashion/PageCheckout/PaymentMethod/IsvPayment/api/customer';
import { Constants } from '../../../fashion/PageCheckout/PaymentMethod/IsvPayment/Constants';
import BaseAddressForm from '../../../fashion/components/BaseAddressForm/BaseAddressForm.vue';
import BaseInput from '../../../fashion/components/BaseInput/BaseInput';
import BaseForm from '../../../fashion/components/BaseForm/BaseForm.vue';
import useCustomerTools from 'hooks/useCustomerTools';

export default {
  components: {
    BaseForm,
    BaseAddressForm,
    BaseInput,
  },
  props: {
    billingAddress: Object,
    shippingAddress: Object,
  },
  setup(props,{ emit }) {
    // Reactive state variables
    const {getMe} = useCustomerTools();
    const customerTokenObj = ref(null);
    const me = ref(null);
    const expiryYearOption = ref([]);
    const loading = ref(false);
    const showAddress = ref(false);
    const addressesLength = ref(Constants.NUMBER_ZERO);
    const addresses = ref(null);
    const selectedAddressId = ref(null);
    const differentAddress = ref(false);
    const newBillingAddress = ref(null);
    const newShippingAddress = ref(null);
    const customerId = ref(null);
    const displayAddresses = ref(null);
    const selectedMonth = ref(null);
    const selectedYear = ref(null);
    const success = ref(null);
    const error = ref(null);
    const errorFlag = ref(false);
    const router = useRouter();


    // Computed properties
    const billingToJSON = computed(() => JSON.stringify(newBillingAddress.value));
    const shippingToJSON = computed(() => JSON.stringify(newShippingAddress.value));

    watch(
        () => getMe.me.value,
        async (newValue) => {
          if (newValue && newValue.me) {
            me.value = newValue.me;
          }
          let existingTokens;
          let existingTokensMap;
          const year = new Date().getFullYear();
          let current = year;
          customerId.value = me.value.customer.id;
          expiryYearOption.value = [];
          for (let i = Constants.NUMBER_ZERO; i <= Constants.NUMBER_NINE; i++) {
            if (year + i == current) {
              expiryYearOption.value.push({
                value: year + i,
                text: year + i,
              });
            } else {
              expiryYearOption.value.push({
                value: year + i,
                text: year + i,
              });
            }
          }
          const customerObject = await customer.getCustomer(me.value.customer.id);
          if (Constants.STRING_CUSTOM in customerObject) {
            existingTokens = customerObject.custom.fields.isv_tokens;
            existingTokensMap = existingTokens.map((item) => item);
            existingTokensMap.forEach((token) => {
              const newToken = JSON.parse(token);
              console.log("Line 449",newToken.paymentToken,router)
              if (newToken.paymentToken == router.currentRoute.value.params.token) {
                customerTokenObj.value = newToken;
                displayAddresses.value = customerObject.addresses;
              }
            });
          }
        },
        { immediate: true } 
      );

    watch(differentAddress, () => {
      if (!differentAddress.value) {
        newShippingAddress.value = newBillingAddress.value;
        validShippingForm(true);
      } else {
        validShippingForm(false);
      }
    });

    // Methods
    const getMonth = (monthNumber) => {
      const date = new Date(Constants.NUMBER_ZERO, monthNumber, Constants.NUMBER_ZERO);
      return date.toLocaleString(Constants.STRING_UN_ES, { month: Constants.STRING_LONG });
    };

    const onYearChange = (event) => {
      selectedYear.value = event.target.value;
    };

    const onMonthChange = (event) => {
      selectedMonth.value = event.target.value;
    };

    const updateToken = async (customerTokenObj) => {
      let lastCustomer;
      let customerResponse;
      let customerObj;
      let length = Constants.NUMBER_ZERO;
      let updateFlag = false;
      success.value = null;
      error.value = null;
      let addressId = null;
      let month;
      let year;
      let currentDate;
      let currentMonth;
      let currentYear;

      loading.value = true;
      const customerTokenObject = {
        version: null,
        body: null,
        newExpiryMonth: null,
        newExpiryYear: null,
        action: null
      };

      const updateObject = {
        version: null,
        address: null
      };

      if (!selectedMonth.value) selectedMonth.value = customerTokenObj.cardExpiryMonth;
      if (!selectedYear.value) selectedYear.value = customerTokenObj.cardExpiryYear;
      currentDate = new Date();
      currentMonth = currentDate.getMonth() + Constants.NUMBER_ONE;
      currentYear = currentDate.getFullYear();

      if (selectedYear.value === currentYear && selectedMonth.value < currentMonth) {
        errorFlag.value = true;
        loading.value = false;
        error.value = Constants.ERROR_MSG_INVALID_EXPIRY_DATE;
      }

      if (!errorFlag.value) {
        lastCustomer = await customer.getCustomer(me.value.customer.id);
        addressId = selectedAddressId.value || (newBillingAddress.value ? newBillingAddress.value.id : customerTokenObj.addressId);
        customerObj = prepareUpdateTokenFields(customerTokenObj, addressId);
        customerTokenObject.body = customerObj;
        customerTokenObject.version = lastCustomer.version;
        if (selectedMonth.value && selectedYear.value) {
          customerTokenObject.newExpiryMonth = selectedMonth.value;
          customerTokenObject.newExpiryYear = selectedYear.value;
        }
        customerTokenObject.isv_tokenAction = Constants.STRING_UPDATE;

        customerResponse = await customer.updateCustomerToken(customerTokenObject);
        if (customerResponse.errors) {
          loading.value = false;
          error.value = handleError(customerResponse);
        } else {
          updateFlag = customerResponse.custom.fields.isv_tokenUpdated;
          if (updateFlag) {
            loading.value = false;
            success.value = Constants.SUCCESS_MSG_UPDATE_CARD;
          } else {
            loading.value = false;
            error.value = Constants.ERROR_MSG_UPDATE_CARD;
          }
        }
         router.push({
          name: 'mycards', 
          params: {
            token: customerTokenObj.paymentToken,
            // success: success.value,
            // error: error.value
          },
        // TODO:modified
          query: {
            success: success.value,  // Passing as query parameter
            error: error.value       // Passing as query parameter
          },
        });
      }
    };

    const prepareUpdateTokenFields = (customerTokenObj, addressId) => {
      return {
        alias: customerTokenObj.alias,
        value: customerTokenObj.value,
        paymentToken: customerTokenObj.paymentToken,
        instrumentIdentifier: customerTokenObj.instrumentIdentifier,
        cardType: customerTokenObj.cardType,
        cardName: customerTokenObj.cardName,
        cardNumber: customerTokenObj.cardNumber,
        cardExpiryMonth: customerTokenObj.cardExpiryMonth,
        cardExpiryYear: customerTokenObj.cardExpiryYear,
        addressId
      };
    };

    const handleError = (response) => {
      switch (response.statusCode) {
        case Constants.NUMBER_FIVE_ZERO_TWO:
          return Constants.ERROR_MSG_FIVE_ZERO_TWO;
        case Constants.NUMBER_FIVE_ZERO_FOUR:
          return Constants.ERROR_MSG_FIVE_ZERO_FOUR;
        default:
          return Constants.ERROR_MSG_SUNRISE;
      }
    };

    const updateAddress = async (addressId) => {
      const customerObject = await customer.getCustomer(me.value.customer.id);
      if (customerObject.addresses.length > 0) {
        addressesLength.value = customerObject.addresses.length;
        addresses.value = customerObject.addresses;
        selectedAddressId.value = addressId;
      }
      showAddress.value = true;
    };

    const onAddressChange = (event) => {
      success.value = null;
      error.value = null;
      selectedAddressId.value = event.target.value;
    };

    const showNewAddress = () => {
      success.value = null;
      error.value = null;
      selectedAddressId.value = null;
      addressesLength.value = Constants.NUMBER_ZERO;
    };

    const cancelAddress = async (addressId) => {
      const customerObject = await customer.getCustomer(me.value.customer.id);
      if (customerObject.addresses.length > 0) {
        addressesLength.value = customerObject.addresses.length;
        addresses.value = customerObject.addresses;
        selectedAddressId.value = addressId;
      }
    };

    const showUpdateForm = () => {
      showAddress.value = false;
    };

    const unsetBillingAddress = () => setBillingAddress(null);

    const updateBillingAddress = (address) => {
      newBillingAddress.value = address;
    };

    const updateShippingAddress = (address) => {
      newShippingAddress.value = address;
    };

    const validBillingForm = (valid) => {
      emit('valid-billing-form', valid);
    };

    const validShippingForm = (valid) => {
      emit('valid-shipping-form', valid);
    };

    const navigateToMyCards = () => {
        router.push({
          name: 'mycards'
        });
      };

    // Return everything to be used in the template
    return {
      customerTokenObj,
      me,
      expiryYearOption,
      loading,
      showAddress,
      addressesLength,
      addresses,
      selectedAddressId,
      differentAddress,
      newBillingAddress,
      newShippingAddress,
      customerId,
      displayAddresses,
      selectedMonth,
      selectedYear,
      billingToJSON,
      shippingToJSON,
      success,
      error,
      getMonth,
      onYearChange,
      onMonthChange,
      updateToken,
      prepareUpdateTokenFields,
      updateAddress,
      onAddressChange,
      showNewAddress,
      cancelAddress,
      showUpdateForm,
      unsetBillingAddress,
      updateBillingAddress,
      updateShippingAddress,
      validBillingForm,
      validShippingForm,
      navigateToMyCards
    };
  }
}
