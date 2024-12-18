/* eslint-disable no-unused-vars */

/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';
import jwt_decode from 'jwt-decode'
// import gql from 'graphql-tag';
import authMixin from '../../../../mixins/authMixin';
import customer from '../../../fashion/PageCheckout/PaymentMethod/IsvPayment/api/customer';
import { Constants } from '../../../fashion/PageCheckout/PaymentMethod/IsvPayment/Constants';
import flexStyle from '../../../fashion/PageCheckout/PaymentMethod/IsvPayment/FlexMicroformStyle';
import BaseAddressForm from '../../../fashion/components/BaseAddressForm/BaseAddressForm.vue'; //TODO:modified
import BaseInput from '../../../fashion/components/BaseInput/BaseInput';
import BaseForm from '../../../fashion/components/BaseForm/BaseForm.vue';
import ipAddress from '../../../fashion/PageCheckout/PaymentMethod/IsvPayment/api/ipAddress';
import useCustomerTools from 'hooks/useCustomerTools';
import { reactive } from 'vue';
import { useStore } from 'vuex';
import { onMounted, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router'; // If you're using Vue Router
import useCart from 'hooks/useCart';

const deviceFingerprintId = uuidv4();
const dfpUrl = Constants.DEVICE_FINGERPRINT_URL + deviceFingerprintId;
var isSideBarEnabled = 'false';
if (
  undefined != process.env.VUE_APP_USE_UC_SIDE_BAR_CONFIG
) {
  isSideBarEnabled =
    process.env.VUE_APP_USE_UC_SIDE_BAR_CONFIG;
}
var unifiedCheckoutVariable = 'false';
if (undefined != process.env.VUE_APP_USE_UNIFIED_CHECKOUT) {
  unifiedCheckoutVariable =
    process.env.VUE_APP_USE_UNIFIED_CHECKOUT;
}
const unifiedCheckoutFlag = unifiedCheckoutVariable;
var enableUCBillingAddressVariable = 'false';
if (
  undefined != process.env.VUE_APP_USE_UC_BILLING_ADDRESS
) {
  enableUCBillingAddressVariable =
    process.env.VUE_APP_USE_UC_BILLING_ADDRESS;
}
const enableUCBillingAddress = enableUCBillingAddressVariable;
var flexSourceUrl;

if (
  process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase() ==
  Constants.ISV_PAYMENT_ENVIRONMENT_TEST
) {
  flexSourceUrl = Constants.TEST_FLEX_SOURCE_URL;
} else if (
  process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase() ==
  Constants.ISV_PAYMENT_ENVIRONMENT_PRODUCTION
) {
  flexSourceUrl = Constants.PRODUCTION_FLEX_SOURCE_URL;
}

export default {
  mixins: [authMixin],
  props: {
    billingAddress: Object,
    shippingAddress: Object,
  },
  components: {
    BaseForm,
    BaseAddressForm,//todo:need to change the component
    BaseInput,
  },
  setup(props , { emit }) {
    let customerTokenObjs = ref([]);
    const {getMe} = useCustomerTools();
    const {login,showLoggedIn} = useCustomerTools();
    let me = ref(null);
  //   let me = {
  //     "customer":{
  //     "id": "e9437d92-c802-4bd2-ad68-8435527be68c",
  //     "firstName": "aws",
  //     "lastName": "t",
  //     "customerNumber": null,
  //     "version": 18,
  //     "__typename": "Customer"
  //     }
  // };
  // let me = tools.getMe.me.value;
  // let me = tools.getMe();
    let error = ref(null);
    let success = ref(null);
    let newBillingAddress = ref(null);
    let newShippingAddress = ref(null);
    let flexMicroFormObject = ref(null);
    let addresses = ref(null);
    let isOpenIndex = ref(null);
    let displayAddresses = ref(null);
    let selectedAddressId = ref(null);
    let showMyAccountFlex = ref(false);
    let showAddress = ref(false);
    let jsLoaded = ref(false);
    let differentAddress = ref(false);
    let loading = ref(false);
    let showCardDetail = ref(false);
    let expiryYearOption = ref([]);
    let addressesLength = ref(Constants.NUMBER_ZERO);
    let customerTokenObjLen = ref(Constants.NUMBER_ZERO);
    // let dfpUrl = dfpUrl;
    let showUc = ref(true);
    let showUnifiedMethods = ref(false);
    let unifiedCheckout = reactive({
      jsLoaded: false,
      transientToken: null,
    });
    let showAddressforUC = ref(false);
    let failedTokenLen = ref(Constants.NUMBER_ZERO);
    let showUCTokenAlias = ref(false);
    let store = useStore();
    const route = useRouter();
    // me.value = getMe.me.value.me
    // me.value = customer;
    // watch: {
    //   me: async function () {
    //     const customerObject = await customer.getCustomer(this.me.customer.id);
    //     if (Constants.STRING_CUSTOM in customerObject) {
    //       var gotcustomerTokenObjs = customerObject.custom.fields.isv_tokens;
    //       this.customerTokenObjs = gotcustomerTokenObjs.map((item) => JSON.parse(item));
    //       this.customerTokenObjLen = this.customerTokenObjs.length;
    //       this.displayAddresses = customerObject.addresses;
    //     }

    watch(
      () => getMe.me.value,
      async (newValue) => {
        if (newValue && newValue.me) {
          me.value = newValue.me;
        }
        if (newValue.me.customer && newValue.me.customer.id) {
          const customerObject = await customer.getCustomer(
            newValue.me.customer.id
          );
          if (Constants.STRING_CUSTOM in customerObject) {
            const gotcustomerTokenObjs =
              customerObject.custom.fields.isv_tokens;
            customerTokenObjs.value = gotcustomerTokenObjs.map(
              item => JSON.parse(item)
            );
            customerTokenObjLen.value =
              customerTokenObjs.value.length;
             displayAddresses.value = customerObject.addresses;
            //  displayAddresses.value = computed(() => {
            //   return customerAddress.filter(address => 
            //     address.id === customerTokenObjs.value.addressId
            //   );
            // });
          
          }
        }

      },
      { immediate: true } 
    );
    // watch(me, async newMe => {
    //   console.log("newme",JSON.stringify(newMe,{depth:null}))
    //   if (newMe.customer && newMe.customer.id) {
    //     console.log("inside if")
    //     const customerObject = await customer.getCustomer(
    //       newMe.customer.id
    //     );
    //     console.log("customobj",JSON.stringify(customerObject))
    //     if (Constants.STRING_CUSTOM in customerObject) {
    //       const gotcustomerTokenObjs =
    //         customerObject.custom.fields.isv_tokens;
    //       customerTokenObjs.value = gotcustomerTokenObjs.map(
    //         item => JSON.parse(item)
    //       );
    //       customerTokenObjLen.value =
    //         customerTokenObjs.value.length;
    //       displayAddresses.value = customerObject.addresses;
    //     }
    //   }
    // });

    watch(customerTokenObjLen, (newLen) => {
      console.log("Customer token object length changed:", newLen);
    });
    // const customerTokenObjLen = computed(() => {
    //   console.log("called computed")
    //   return customerTokenObjLen.value;
    // });
    // differentAddress.value = () => {
    //   if (!differentAddress.value) {
    //     newShippingAddress.value = newBillingAddress.value;
    //     validShippingForm(true);
    //   } else {
    //     validShippingForm(false);
    //   }
    // };
    //   const billingToJSON = async () =>{
    //     this.$emit('update-billing-details', newBillingAddress.value);
    //   };
    //  const shippingToJSON = async() => {
    //     this.$emit('update-shipping-details', newShippingAddress.value);
    //   };

    watch(differentAddress.value, (newValue) => {
      if (!newValue) {
        newShippingAddress.value = newBillingAddress.value;
        validShippingForm(true);
      } else {
        validShippingForm(false);
      }
    });

    // Watch `newBillingAddress` to emit updates
    watch(newBillingAddress.value, (newValue) => {
      emit("update-billing-details", newValue);
    });

    // Watch `newShippingAddress` to emit updates
    watch(newShippingAddress.value, (newValue) => {
      emit("update-shipping-details", newValue);
    });

    // const emitBillingDetails = () => {
    //   // Emit the updated billing details
    //   this.$emit(
    //     'update-billing-details',
    //     newBillingAddress.value
    //   );
    // };

    // const emitShippingDetails = () => {
    //   // Emit the updated shipping details
    //   this.$emit(
    //     'update-shipping-details',
    //     newShippingAddress.value
    //   );
    // };

    const showDiv = async token => {
      console.log("called",token,isOpenIndex.value)
      if (isOpenIndex.value !== null) {
        isOpenIndex.value =
          isOpenIndex.value == token ? null : token;
      } else {
        isOpenIndex.value = token;
      }
    };

    const toggle = async id => {
      const index = this.opened.indexOf(id);
      if (index > -1) {
        this.opened.splice(index, 1);
      } else {
        this.opened.push(id);
      }
    };

    const getMonth = async monthNumber => {
      var date = new Date(
        Constants.NUMBER_ZERO,
        monthNumber,
        Constants.NUMBER_ZERO
      );
      var longMonth = date.toLocaleString(
        Constants.STRING_UN_ES,
        { month: Constants.STRING_LONG }
      );
      return longMonth;
    };

    const onYearChange = async event => {
      this.selectedYear = event;
      console.log(this.selectedYear);
    };

    const onMonthChange = async event => {
      this.selectedMonth = event.target.value;
      console.log(this.selectedMonth);
    };

    const deleteToken = async deleteTokenObj => {
      var customerObj;
      var oldTokenLength;
      var deleteResponse;
      var newTokenLength;
      var lastCustomerTokens;
      loading.value = true;
      success.value = null;
      error.value = null;
      console.log("me delete", me.value.customer)
      var customerTokenObject = {
        version: null,
        body: null,
        isv_tokenAction: null,
      };
      customerTokenObject.body = deleteTokenObj;
      customerTokenObject.isv_tokenAction =
        Constants.STRING_DELETE;
      customerObj = await customer.getCustomer(
        me.value.customer.id
      );
      console.log("cobg",customerObj)
      customerTokenObject.version =
        customerObj.version;
      oldTokenLength =
        customerObj.custom.fields.isv_tokens.length;
      deleteResponse = await customer.deleteCustomerToken(
        customerTokenObject
      );
      if (deleteResponse.errors) {
        loading.value = false;
        if (
          Constants.NUMBER_FIVE_ZERO_TWO ==
          deleteResponse.statusCode
        ) {
          error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
        } else if (
          Constants.NUMBER_FIVE_ZERO_FOUR ==
          deleteResponse.statusCode
        ) {
          error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
        } else {
          error.value = Constants.ERROR_MSG_SUNRISE;
        }
        lastCustomerTokens =
          customerObj.custom.fields.isv_tokens;
        customerTokenObjs.value = lastCustomerTokens.map(
          item => JSON.parse(item)
        );
      } else {
        if (
          Constants.ISV_TOKENS in
          deleteResponse.custom.fields
        ) {
          newTokenLength =
            deleteResponse.custom.fields.isv_tokens.length;
          customerTokenObjs.value = deleteResponse.custom.fields.isv_tokens.map(
            item => JSON.parse(item)
          );
          customerTokenObjLen.value = newTokenLength;
          if (
            oldTokenLength ==
            newTokenLength + Constants.VALUE_ONE
          ) {
            loading.value = false;
            if (newTokenLength == Constants.NUMBER_ZERO) {
              success.value =
                Constants.SUCCESS_MSG_DELETE_TOKEN;
            } else {
              success.value =
                Constants.SUCCESS_MSG_DELETE_TOKEN;
            }
            return;
          } else {
            lastCustomerTokens =
              customerObj.custom.fields.isv_tokens;
            customerTokenObjs.value = lastCustomerTokens.map(
              item => JSON.parse(item)
            );
            loading.value = false;
            error.value = Constants.ERROR_MSG_DELETE_TOKEN;
            return;
          }
        }
      }
    };

    const appendFlexJS = async () => {
      var flexScript;
      if (!jsLoaded.value) {
        jsLoaded.value = new Promise(function(
          resolve,
          reject
        ) {
          flexScript = document.createElement(
            Constants.STRING_SCRIPT
          );
          flexScript.setAttribute(
            Constants.STRING_SRC,
            flexSourceUrl
          );
          flexScript.onload = function() {
            resolve(true);
          };
          flexScript.onerror = function(event) {
            reject(event);
          };
          document.head.appendChild(flexScript);
        });
      }
      return jsLoaded.value;
    };

    const renderFunction = async () => {
      if (Constants.STRING_TRUE == unifiedCheckoutFlag) {
        showUCTokenAlias.value = true;
        showAddressforUC.value = false;
        unifiedCheckout.transientToken = null,
        unifiedCheckout.jsLoaded = false;
        showUc.value = false;
        saveCardMyAccountUC();
      } else {
        showUCTokenAlias.value = false;
        saveCardMyAccount();
      }
    };

    const saveCardMyAccount = async () => {
      var customerResponse;
      var customerObject;
      var captureContext;
      var flexInstance;
      var flexMicroform;
      showMyAccountFlex.value = true;
      success.value = null;
      error.value = null;
      let year = new Date().getFullYear();
      let current = year;
      expiryYearOption.value = [];
      for (
        var i = Constants.NUMBER_ZERO;
        i <= Constants.NUMBER_NINE;
        i++
      ) {
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
      await appendFlexJS();
      console.log("calling getcustomer",me.value.customer.id)
      customerObject = await customer.getCustomer(
        me.value.customer.id
      );
      if (Constants.STRING_CUSTOM in customerObject) {
        customerResponse = await customer.update(
          customerObject
        );
      } else {
        customerResponse = await customer.updateWithCustomData(
          customerObject
        );
      }
      if (customerResponse.errors) {
        loading.value = false;
        if (
          Constants.NUMBER_FIVE_ZERO_TWO ==
          customerResponse.statusCode
        ) {
          error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
        } else if (
          Constants.NUMBER_FIVE_ZERO_FOUR ==
          customerResponse.statusCode
        ) {
          error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
        } else {
          error.value = Constants.ERROR_MSG_SUNRISE;
        }
      }
      if (
        null != customerResponse &&
        Constants.STRING_CUSTOM in customerResponse &&
        Constants.STRING_FIELDS in
          customerResponse.custom &&
        Constants.ISV_TOKEN_CAPTURE_CONTEXT in
          customerResponse.custom.fields &&
        Constants.EMPTY_STRING !=
          customerResponse.custom.fields
            .isv_tokenCaptureContextSignature
      ) {
        captureContext =
          customerResponse.custom.fields
            .isv_tokenCaptureContextSignature;
        // Flex comes from flex JS on appendFlexJS()
        // eslint-disable-next-line
        flexInstance = new Flex(captureContext);
        flexMicroform = flexInstance.microform({
          styles: flexStyle,
        });
        flexMicroform
          .createField(Constants.STRING_NUMBER, {
            placeholder:
              Constants.PLACEHOLDER_ENTER_CARD_NO,
          })
          .load('#number-container-1');
        flexMicroform
          .createField(Constants.STRING_SECURITY_CODE, {
            placeholder: Constants.PLACEHOLDER_3DOTS,
          })
          .load('#securityCode-container');
          console.log("fl form",flexMicroform);
        flexMicroFormObject.value = flexMicroform;
      } else {
        loading.value = false;
        error.value = Constants.ERROR_MSG_FORM_LOAD;
        return;
      }
    };

    const saveCardMyAccountUC = async () => {
      var captureContext;
      const showArgs = {
        containers: {
          paymentSelection: '#buttonPaymentListContainers',
          ...(Constants.STRING_FALSE ==isSideBarEnabled && {
            paymentScreen: '#embeddedPaymentContainer',
          }),
        },
      };
      let captureData;
      let clientLibraryUrl;
      var thisContext = this;
      var errorFlag = false;
      var lastCustomerTokens;
      var updateAddressIdInToken = {
        id: null,
        version: null,
        isv_tokens: null,
      };
      var customerObject;
      var transientToken;
      if (unifiedCheckoutFlag == Constants.STRING_TRUE) {
        showAddress.value = false;
        showMyAccountFlex.value = false;
        showUc.value = true;
        customerObject = await customer.getCustomer(
          me.value.customer.id
        );
        if (
          enableUCBillingAddress == Constants.STRING_TRUE
        ) {
          captureContext = await ipAddress.getCaptureContext(
            null,
            null,
            store.state.country,
            store.state.locale,
            store.state.currency
          );
          if (Constants.EMPTY_STRING != captureContext) {
            showUnifiedMethods.value = true;
            captureData = jwt_decode(captureContext);
            clientLibraryUrl =
              captureData.ctx[0].data.clientLibrary;
            await appendUnifiedCheckoutJS(clientLibraryUrl);
            // eslint-disable-next-line no-undef
            Accept(captureContext)
              .then(accept => {
                return Constants.STRING_FALSE ==
                  isSideBarEnabled
                  ? accept.unifiedPayments(false)
                  : accept.unifiedPayments();
              })
              .then(function(up) {
                return up.show(showArgs);
              })
              .then(function(tt) {
                transientToken = tt;
                unifiedCheckout.transientToken = tt;
                updateUcAddress();
              });
          } else {
            loading.value = false;
            error.value = Constants.ERROR_MSG_FORM_LOAD;
            return;
          }
        } else {
          submitCard();
        }
      }
    };

    const ucNext = async () => {
      var customerObject;
      var transientToken;
      var captureContext;
      const showArgs = {
        containers: {
          paymentSelection: '#buttonPaymentListContainers',
          ...(Constants.STRING_FALSE ==
            isSideBarEnabled && {
            paymentScreen: '#embeddedPaymentContainer',
          }),
        },
      };
      let captureData;
      let clientLibraryUrl;
      var thisContext = this;
      var errorFlag = false;
      showMyAccountFlex.value = false;
      showUc.value = true;
      showAddressforUC.value = false;
      customerObject = await customer.getCustomer(
        me.value.customer.id
      );
      captureContext = await ipAddress.getCaptureContext(
        null,
        null,
        store.state.country,
        store.state.locale,
        store.state.currency
      );
      if (Constants.EMPTY_STRING != captureContext) {
        showUnifiedMethods.value = true;
        captureData = jwt_decode(captureContext);
        clientLibraryUrl =
          captureData.ctx[0].data.clientLibrary;
        await appendUnifiedCheckoutJS(clientLibraryUrl);

        // eslint-disable-next-line no-undef
        Accept(captureContext)
          .then(accept => {
            return Constants.STRING_FALSE ==
              isSideBarEnabled
              ? accept.unifiedPayments(false)
              : accept.unifiedPayments();
          })
          .then(function(up) {
            return up.show(showArgs);
          })
          .then(function(tt) {
            transientToken = tt;
            unifiedCheckout.transientToken = tt;
            updateUcAddress();
          });
      } else {
        loading.value = false;
        error.value = Constants.ERROR_MSG_FORM_LOAD;
        return;
      }
    };
    const updateUcAddress = async () => {
      var customerObject;
      var customerResponse;
      var customerResponseIn;
      var errorFlag = false;
      var lastCustomerTokens;
      var updateAddresIdObject = {
        version: null,
        addressId: null,
        body: null,
        tokenAlias: null,
      };
      var updateAddressIdInToken = {
        // id: null,
        version: null,
        isv_tokens: null,
      };
      var updateAddressIdUCObj = {
        version: null,
        tokenAlias: Constants.EMPTY_STRING,
        addressId: Constants.EMPTY_STRING,
        body: {},
        customPresent: false,
      };
      var updateObject = {
        version: null,
        address: null,
      };
      var tokenExists = false;
      var tokenData = {};
      loading.value = true;
      var parsedCustomerTokens;
      var customerTokenObjects;
      var lengthNow;
      var existingTokens;
      failedTokenLen.value = Constants.NUMBER_ZERO;
      var savedTokenLen = Constants.NUMBER_ZERO;
      customerObject = await customer.getCustomer(
        me.value.customer.id
      );
      if (
        customerObject?.custom?.fields?.isv_failedTokens &&
        customerObject.custom.fields.isv_failedTokens
          .length > 0
      ) {
        failedTokenLen.value =
          customerObject.custom.fields.isv_failedTokens.length;
      }
      if (
        customerObject?.custom?.fields?.isv_tokens &&
        customerObject?.custom?.fields?.isv_tokens.length >
          0
      ) {
        savedTokenLen =
          customerObject.custom.fields.isv_tokens.length;
      }
      if (Constants.STRING_TRUE == enableUCBillingAddress) {
        updateAddressIdUCObj.version =
          customerObject.version;
        updateAddressIdUCObj.tokenAlias = document.querySelector(
          '#ucTokenAlias'
        ).value;
        updateAddressIdUCObj.addressId = 'UCAddress';
        updateAddressIdUCObj.body = await prepareUnifiedCheckoutCustomFields(
          customerObject
        );
        if (customerObject?.custom?.fields) {
          updateAddressIdUCObj.customPresent = true;
        }
        customerResponseIn = await customer.newCustomFunction(
          updateAddressIdUCObj
        );
        customerResponse = customerResponseIn;
        if (customerResponseIn.errors) {
          loading.value = false;
          errorFlag = true;
          if (
            Constants.NUMBER_FIVE_ZERO_TWO ==
            customerResponse?.statusCode
          ) {
            error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
          } else if (
            Constants.NUMBER_FIVE_ZERO_FOUR ==
            customerResponse?.statusCode
          ) {
            error.value =
              Constants.ERROR_MSG_FIVE_ZERO_FOUR;
          } else {
            error.value = Constants.ERROR_MSG_SUNRISE;
          }
          if (customerObject?.custom?.fields?.isv_tokens) {
            lastCustomerTokens =
              customerObject.custom.fields.isv_tokens;
            customerTokenObjLen.value =
              lastCustomerTokens.length;
            customerTokenObjs.value = lastCustomerTokens.map(
              item => JSON.parse(item)
            );
          }
        } else {
          if (
            customerResponseIn?.custom?.fields
              ?.isv_failedTokens &&
            customerResponseIn?.custom?.fields
              ?.isv_failedTokens.length >
              failedTokenLen.value
          ) {
            errorFlag = true;
          } else if (
            customerResponseIn?.custom?.fields?.isv_tokens
          ) {
            lastCustomerTokens =
              customerResponseIn.custom.fields.isv_tokens;
            customerTokenObjLen.value =
              lastCustomerTokens.length;
            customerTokenObjs.value = lastCustomerTokens.map(
              item => JSON.parse(item)
            );
            parsedCustomerTokens = lastCustomerTokens.map(
              item => JSON.parse(item)
            );
            customerTokenObjects = lastCustomerTokens.map(
              item => item
            );
            lengthNow = customerTokenObjects.length - 1;
            console.log(
              'Line 487',
              JSON.stringify(
                parsedCustomerTokens[lengthNow]
              )
            );
            let address =
              parsedCustomerTokens[lengthNow].address;
            let billingAddress = {
              firstName: address.firstName,
              lastName: address.lastName,
              streetName: address.address1,
              additionalStreetInfo:
                address?.additionalStreetInfo ||
                address?.buildingNumber ||
                '',
              city: address.locality,
              postalCode: address.postalCode,
              region: address.administrativeArea,
              country: address.country,
              email: address.email,
              phone: address.phone,
            };
            let updateObject = {
              version: customerResponse.version,
              address: billingAddress,
            };
            customerResponseIn = await customer.updateAddress(
              updateObject
            );
            tokenData = {
              alias: parsedCustomerTokens[lengthNow].alias,
              value: parsedCustomerTokens[lengthNow].value,
              paymentToken:
                parsedCustomerTokens[lengthNow]
                  .paymentToken,
              instrumentIdentifier:
                parsedCustomerTokens[lengthNow]
                  .instrumentIdentifier,
              cardType:
                parsedCustomerTokens[lengthNow].cardType,
              cardName:
                parsedCustomerTokens[lengthNow].cardType,
              cardNumber:
                parsedCustomerTokens[lengthNow].cardNumber,
              cardExpiryMonth:
                parsedCustomerTokens[lengthNow]
                  .cardExpiryMonth,
              cardExpiryYear:
                parsedCustomerTokens[lengthNow]
                  .cardExpiryYear,
              addressId:
                customerResponseIn.addresses[
                  customerResponseIn.addresses.length - 1
                ].id,
              timestamp:
                parsedCustomerTokens[lengthNow].timestamp,
            };
            customerTokenObjects[
              lengthNow
            ] = JSON.stringify(tokenData);
            updateAddressIdInToken.version =
              customerResponseIn.version;
            updateAddressIdInToken.isv_tokens = customerTokenObjects;
            customerResponse = await customer.updateAddressIdWithUC(
              updateAddressIdInToken
            );
            if (customerResponse.errors) {
              errorFlag = true;
            } else {
              console.log('else');
            }
          } else {
            errorFlag = true;
          }
        }
      } else {
        if (null != selectedAddressId.value) {
          updateAddresIdObject.addressId =
            selectedAddressId.value;
          updateAddresIdObject.version =
            customerObject.version;
          updateAddresIdObject.tokenAlias = document.querySelector(
            '#ucTokenAlias'
          ).value;
          updateAddresIdObject.body = await prepareUnifiedCheckoutCustomFields(
            customerObject
          );
          customerResponse = await customer.updateAddressId(
            updateAddresIdObject
          );
          if (customerResponse.errors) {
            errorFlag = true;
          } else {
            if (
              customerObject?.custom?.fields
                ?.isv_failedTokens
            ) {
              failedTokenLen.value =
                customerObject.custom.fields.isv_failedTokens.length;
              if (
                failedTokenLen.value ==
                customerResponse.custom.fields
                  .isv_failedTokens.length
              ) {
                console.log('failedTokenLength is same');
              } else {
                errorFlag = true;
              }
            } else {
              if (
                customerResponse?.custom?.fields
                  ?.isv_failedTokens
              ) {
                errorFlag = true;
              }
            }
          }
        } else {
          updateObject.version = customerObject.version;
          updateObject.address = newBillingAddress;
          customerResponse = await customer.updateNewAddressUC(
            updateObject
          );
          if (customerResponse.errors) {
            errorFlag = true;
          } else {
            updateAddressIdUCObj.addressId =
              customerResponse.addresses[
                customerResponse.addresses.length - 1
              ].id;
            updateAddressIdUCObj.version =
              customerResponse.version;
            updateAddressIdUCObj.tokenAlias = document.querySelector(
              '#ucTokenAlias'
            ).value;
            if (customerObject?.custom?.fields) {
              updateAddressIdUCObj.customPresent = true;
            }
            updateAddressIdUCObj.body = await prepareUnifiedCheckoutCustomFields(
              customerObject
            );
            customerResponse = await customer.newCustomFunction(
              updateAddressIdUCObj
            );
            if (customerResponse.errors) {
              errorFlag = true;
            }
            if (
              customerObject?.custom?.fields
                ?.isv_failedTokens
            ) {
              failedTokenLen.value =
                customerObject.custom.fields.isv_failedTokens.length;
              if (
                failedTokenLen.value ==
                customerResponse.custom.fields
                  .isv_failedTokens.length
              ) {
                console.log('failedTokenLength is same');
              } else {
                errorFlag = true;
              }
            } else {
              if (
                customerResponse?.custom?.fields
                  ?.isv_failedTokens
              ) {
                errorFlag = true;
              }
            }
          }
        }
      }
      if (!errorFlag) {
        loading.value = false;
        showUc.value = false;
        showAddressforUC.value = false;
        unifiedCheckout.transientToken = null;
        unifiedCheckout.jsLoaded = false;
        showUnifiedMethods.value = false;
        showUCTokenAlias.value = false;
        if (
          customerResponse?.addresses &&
          0 < customerResponse.addresses.length
        ) {
          displayAddresses.value =
            customerResponse.addresses;
        }
        if (
          customerResponse?.custom?.fields?.isv_tokens &&
          Constants.NUMBER_ZERO <
            customerResponse.custom.fields.isv_tokens.length
        ) {
          lastCustomerTokens =
            customerResponse.custom.fields.isv_tokens;
          customerTokenObjLen.value =
            lastCustomerTokens.length;
          customerTokenObjs.value = lastCustomerTokens.map(
            item => JSON.parse(item)
          );
        }
        if (
          customerResponse?.custom?.fields?.isv_tokens &&
          customerResponse?.custom?.fields?.isv_tokens
            .length >= savedTokenLen
        ) {
          success.value = Constants.SUCCESS_MSG_ADD_CARD;
        } else {
          error.value = Constants.ERROR_MSG_ADD_CARD;
        }
      } else {
        if (customerResponse?.custom?.fields?.isv_tokens) {
          existingTokens =
            customerResponse.custom.fields.isv_tokens;
          customerTokenObjs.value = existingTokens.map(
            item => JSON.parse(item)
          );
          customerTokenObjLen.value = existingTokens.length;
          if (
            customerObject.custom.fields.isv_tokens
              .length == existingTokens.length
          ) {
            if (
              customerResponse.custom.fields
                .isv_tokenUpdated
            ) {
              success.value =
                Constants.SUCCESS_MSG_UPDATE_CARD;
            } else {
              error.value = Constants.ERROR_MSG_ADD_CARD;
            }
          } else {
            failedTokenLen.value =
              customerObject.custom.fields.isv_failedTokens.length;
            if (
              failedTokenLen.value ==
              customerResponse.custom.fields
                .isv_failedTokens.length
            ) {
              success.value =
                Constants.SUCCESS_MSG_ADD_CARD;
            } else {
              errorFlag = true;
              error.value = Constants.ERROR_MSG_ADD_CARD;
            }
          }
        } else {
          errorFlag = true;
        }
        if (errorFlag) {
          loading.value = false;
          showUc.value = false;
          showAddressforUC.value = false;
          unifiedCheckout.transientToken = null;
          unifiedCheckout.jsLoaded = false;
          showUnifiedMethods.value = false;
          showUCTokenAlias.value = false;
          loading.value = false;
          if (
            Constants.NUMBER_FIVE_ZERO_TWO ==
            customerResponse?.statusCode
          ) {
            error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
          } else if (
            Constants.NUMBER_FIVE_ZERO_FOUR ==
            customerResponse?.statusCode
          ) {
            error.value =
              Constants.ERROR_MSG_FIVE_ZERO_FOUR;
          } else {
            if (
              customerResponse?.custom?.fields?.isv_tokens
            ) {
              lastCustomerTokens =
                customerResponse.custom.fields.isv_tokens;
              customerTokenObjLen.value =
                lastCustomerTokens.length;
              customerTokenObjs.value = lastCustomerTokens.map(
                item => JSON.parse(item)
              );
            }
            error.value = Constants.ERROR_MSG_ADD_CARD;
          }
        }
      }
    };

    const appendUnifiedCheckoutJS = async clientLibraryUrl => {
      var unifiedCheckoutScript;
      if (!unifiedCheckout.jsLoaded) {
        unifiedCheckout.jsLoaded = new Promise(
          function(resolve, reject) {
            unifiedCheckoutScript = document.createElement(
              Constants.STRING_SCRIPT
            );
            unifiedCheckoutScript.setAttribute(
              Constants.STRING_SRC,
              clientLibraryUrl
            );
            unifiedCheckoutScript.onload = function() {
              resolve(true);
            };
            unifiedCheckoutScript.onerror = function(
              event
            ) {
              reject(event);
            };
            document.head.appendChild(
              unifiedCheckoutScript
            );
          }
        );
      }
      return unifiedCheckout.jsLoaded;
    };

    const prepareUnifiedCheckoutCustomFields = async customerObject => {
      var unifiedCheckoutData;
      var paymentCustomFields;
      var failedTokensPresent = false;
      var isv_tokensPresent = false;
      var currencyCode = store.state.currency;
      if (customerObject?.custom?.fields) {
        if (
          customerObject.custom.fields?.isv_tokens &&
          customerObject.custom.fields.isv_tokens.length >
            Constants.NUMBER_ZERO
        ) {
          isv_tokensPresent = true;
        }
        if (
          customerObject.custom.fields?.isv_failedTokens &&
          customerObject.custom.fields.isv_failedTokens
            .length > Constants.NUMBER_ZERO
        ) {
          failedTokensPresent = true;
        }
      }
      if (failedTokensPresent && isv_tokensPresent) {
        return new Promise((resolve, reject) => {
          unifiedCheckoutData = jwt_decode(
            unifiedCheckout.transientToken
          );
          console.log(unifiedCheckoutData.content);
          try {
            paymentCustomFields = {
              isv_token:
                unifiedCheckout.transientToken,
              isv_maskedPan:
                unifiedCheckoutData.content
                  .paymentInformation.card.number.bin +
                unifiedCheckoutData.content
                  .paymentInformation.card.number
                  .maskedValue,
              isv_cardType:
                unifiedCheckoutData.content
                  .paymentInformation.card.type.value,
              isv_cardExpiryMonth:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationMonth
                  .value,
              isv_cardExpiryYear:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationYear
                  .value,
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_currencyCode: currencyCode,
              isv_tokens:
                customerObject.custom.fields.isv_tokens,
              isv_failedTokens:
                customerObject.custom.fields
                  .isv_failedTokens,
            };
            resolve(paymentCustomFields);
          } catch (e) {
            reject(e);
          }
        });
      } else if (
        failedTokensPresent &&
        !isv_tokensPresent
      ) {
        return new Promise((resolve, reject) => {
          unifiedCheckoutData = jwt_decode(
            unifiedCheckout.transientToken
          );
          try {
            paymentCustomFields = {
              isv_token:
                unifiedCheckout.transientToken,
              isv_maskedPan:
                unifiedCheckoutData.content
                  .paymentInformation.card.number.bin +
                unifiedCheckoutData.content
                  .paymentInformation.card.number
                  .maskedValue,
              isv_cardType:
                unifiedCheckoutData.content
                  .paymentInformation.card.type.value,
              isv_cardExpiryMonth:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationMonth
                  .value,
              isv_cardExpiryYear:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationYear
                  .value,
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_currencyCode: currencyCode,
              isv_failedTokens:
                customerObject.custom.fields
                  .isv_failedTokens,
            };
            resolve(paymentCustomFields);
          } catch (e) {
            reject(e);
          }
        });
      } else if (
        !failedTokensPresent &&
        isv_tokensPresent
      ) {
        return new Promise((resolve, reject) => {
          unifiedCheckoutData = jwt_decode(
            unifiedCheckout.transientToken
          );
          try {
            paymentCustomFields = {
              isv_token:
                unifiedCheckout.transientToken,
              isv_maskedPan:
                unifiedCheckoutData.content
                  .paymentInformation.card.number.bin +
                unifiedCheckoutData.content
                  .paymentInformation.card.number
                  .maskedValue,
              isv_cardType:
                unifiedCheckoutData.content
                  .paymentInformation.card.type.value,
              isv_cardExpiryMonth:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationMonth
                  .value,
              isv_cardExpiryYear:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationYear
                  .value,
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_currencyCode: currencyCode,
              isv_tokens:
                customerObject.custom.fields.isv_tokens,
            };
            resolve(paymentCustomFields);
          } catch (e) {
            reject(e);
          }
        });
      } else {
        return new Promise((resolve, reject) => {
          unifiedCheckoutData = jwt_decode(
            unifiedCheckout.transientToken
          );
          try {
            paymentCustomFields = {
              isv_token:
                unifiedCheckout.transientToken,
              isv_maskedPan:
                unifiedCheckoutData.content
                  .paymentInformation.card.number.bin +
                unifiedCheckoutData.content
                  .paymentInformation.card.number
                  .maskedValue,
              isv_cardType:
                unifiedCheckoutData.content
                  .paymentInformation.card.type.value,
              isv_cardExpiryMonth:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationMonth
                  .value,
              isv_cardExpiryYear:
                unifiedCheckoutData.content
                  .paymentInformation.card.expirationYear
                  .value,
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_currencyCode: currencyCode,
            };
            resolve(paymentCustomFields);
          } catch (e) {
            reject(e);
          }
        });
      }
    };

    const submitCard = async () => {
      var customerObject;
      customerObject = await customer.getCustomer(
        me.value.customer.id
      );
      if (
        Constants.STRING_ADDRESSES in customerObject &&
        Constants.NUMBER_ZERO <
          customerObject.addresses.length
      ) {
        addressesLength.value =
          customerObject.addresses.length;
        addresses.value = customerObject.addresses;
        selectedAddressId.value =
          customerObject.addresses[
            Constants.NUMBER_ZERO
          ].id;
      }
      success.value = null;
      error.value = null;
      if (Constants.STRING_TRUE == unifiedCheckoutFlag) {
        showAddressforUC.value = true;
      } else {
        showAddress.value = true;
      }
      showMyAccountFlex.value = false;
    };

    const showMyCards = () => {
      showAddress.value = false;
      showMyAccountFlex.value = true;
    };

    const onAddressChange = event => {
      selectedAddressId.value = event.target.value;
    };

    const showNewAdress = () => {
      selectedAddressId.value = null;
      addressesLength.value = Constants.NUMBER_ZERO;
    };

    const cancelAddress = async () => {
      var customerObject;
      customerObject = await customer.getCustomer(
        me.value.customer.id
      );
      if (
        Constants.STRING_ADDRESSES in customerObject &&
        Constants.NUMBER_ZERO <
          customerObject.addresses.length
      ) {
        addressesLength.value =
          customerObject.addresses.length;
        addresses.value = customerObject.addresses;
        selectedAddressId.value =
          customerObject.addresses[
            Constants.NUMBER_ZERO
          ].id;
      }
    };

    const addAddress = async () => {
      var customerObject;
      var customerResponse;
      var existingTokens;
      var lastCustomerTokens;
      var errorFlag = false;
      var length = Constants.NUMBER_ZERO;
      var updateObject = {
        version: null,
        address: null,
      };
      var updateAddresIdObject = {
        version: null,
        addressId: null,
        body: null,
        tokenAlias: null,
      };
      loading.value = true;
      customerObject = await customer.getCustomer(
        me.value.customer.id
      );
      if (null != selectedAddressId.value) {
        updateAddresIdObject.addressId =
          selectedAddressId.value;
        updateAddresIdObject.version =
          customerObject.version;
      } else {
        updateObject.version = customerObject.version;
        updateObject.address = newBillingAddress.value;
        customerResponse = await customer.updateAddress(
          updateObject
        );
        if (customerResponse.errors) {
          loading.value = false;
          errorFlag = true;
          if (
            Constants.NUMBER_FIVE_ZERO_TWO ==
            customerResponse.statusCode
          ) {
            error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
          } else if (
            Constants.NUMBER_FIVE_ZERO_FOUR ==
            customerResponse.statusCode
          ) {
            error.value =
              Constants.ERROR_MSG_FIVE_ZERO_FOUR;
          } else {
            error.value = Constants.ERROR_MSG_SUNRISE;
          }
          lastCustomerTokens =
            customerObject.custom.fields.isv_tokens;
          customerTokenObjLen.value =
            lastCustomerTokens.length;
          customerTokenObjs.value = lastCustomerTokens.map(
            item => JSON.parse(item)
          );
        } else {
          length = customerResponse.addresses.length;
          updateAddresIdObject.version =
            customerResponse.version;
          updateAddresIdObject.addressId =
            customerResponse.addresses[length - 1].id;
        }
      }
      if (!errorFlag) {
        updateAddresIdObject.tokenAlias = document.querySelector(
          '#tokenAlias'
        ).value;
        updateAddresIdObject.body = await prepareFlexMicroformPaymentFields();
        customerResponse = await customer.updateAddressId(
          updateAddresIdObject
        );
        showAddress.value = false;
        loading.value = false;
        if (customerResponse.errors) {
          errorFlag = true;
        } else {
          console.log("Resp",JSON.stringify(customerResponse))
          if (
            Constants.ISV_TOKENS in
              customerResponse.custom.fields &&
            Constants.NUMBER_ZERO <
              customerResponse.custom.fields.isv_tokens
                .length
          ) {
            existingTokens =
              customerResponse.custom.fields.isv_tokens;
            customerTokenObjs.value = existingTokens.map(
              item => JSON.parse(item)
            );
            customerTokenObjLen.value =
              existingTokens.length;
            if (
              customerObject.custom.fields.isv_tokens
                .length == existingTokens.length
            ) {
              console.log(
                '876',
                JSON.stringify(customerResponse)
              );
              if (
                customerResponse.custom.fields
                  .isv_tokenUpdated
              ) {
                success.value =
                  Constants.SUCCESS_MSG_UPDATE_CARD;
              } else {
                console.log('Line 879');
                error.value = Constants.ERROR_MSG_ADD_CARD;
              }
            } else {
              success.value = Constants.SUCCESS_MSG_ADD_CARD;
            }
          } else {
            errorFlag = true;
          }
        }
        if (errorFlag) {
          loading.value = false;
          if (
            Constants.NUMBER_FIVE_ZERO_TWO ==
            customerResponse.statusCode
          ) {
            error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
          } else if (
            Constants.NUMBER_FIVE_ZERO_FOUR ==
            customerResponse.statusCode
          ) {
            error.value =
              Constants.ERROR_MSG_FIVE_ZERO_FOUR;
          } else {
            if (
              Constants.ISV_TOKENS in
                customerResponse.custom.fields &&
              Constants.NUMBER_ZERO <
                customerResponse.custom.fields.isv_tokens
                  .length
            ) {
              lastCustomerTokens =
                customerResponse.custom.fields.isv_tokens;
              customerTokenObjLen.value =
                lastCustomerTokens.length;
              customerTokenObjs.value = lastCustomerTokens.map(
                item => JSON.parse(item)
              );
            }
            error.value = Constants.ERROR_MSG_ADD_CARD;
          }
        }
      }
    };

    const prepareFlexMicroformPaymentFields = async () => {
      var microform;
      var options;
      var flexData;
      var paymentCustomFields;
      var currencyCode = store.state.currency;
      return new Promise((resolve, reject) => {
        microform = flexMicroFormObject.value;
        options = {
          expirationMonth: document.querySelector(
            '#expMonth'
          ).value,
          expirationYear: document.querySelector('#expYear')
            .value,
        }
        microform.createToken(options, (err, jwtToken) => {

          if (err) {
            console.log("err",err)
            loading.value = false;
            error.value =
              Constants.ERROR_MSG_PAYMENT_PROCESS;
            reject(err.message);
          } else {
            try {
              console.log("jwt",jwt_decode);
              flexData = jwt_decode(jwtToken);
              paymentCustomFields = {
                isv_token: jwtToken,
                isv_maskedPan:
                  flexData.content.paymentInformation.card
                    .number.bin +
                  flexData.content.paymentInformation.card
                    .number.maskedValue,
                isv_cardType:
                  flexData.content.paymentInformation.card
                    .number.detectedCardTypes[0],
                isv_cardExpiryMonth:
                  flexData.content.paymentInformation.card
                    .expirationMonth.value,
                isv_cardExpiryYear:
                  flexData.content.paymentInformation.card
                    .expirationYear.value,
                isv_deviceFingerprintId: deviceFingerprintId,
                isv_currencyCode: currencyCode,
              };
              resolve(paymentCustomFields);
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    };

    const closeSaveCardMyAccount = () => {
      showMyAccountFlex.value = false;
      expiryYearOption.value = [];
      showUCTokenAlias.value = false;
    };

    const closeSaveCardMyAccountUC = () => {
      showAddressforUC.value = false;
      showMyAccountFlex.value = false;
      showUCTokenAlias.value = false;
      expiryYearOption.value = [];
    };

    // const unsetBillingAddress = ()=> {
    //   return setBillingAddress(null);
    // };
    const updateBillingAddress = address => {
      newBillingAddress.value = address;
    };
    const updateShippingAddress = address => {
      newShippingAddress = address;
    };

    const validBillingForm = valid => {
      emit('valid-billing-form', valid);
    };

    const validShippingForm = valid => {
      emit('valid-shipping-form', valid);
    };
    //  // eslint-disable-next-line no-const-assign
    //  billingToJSON = computed(() => {
    //   return JSON.stringify(newBillingAddress.value);
    // });

    //  // eslint-disable-next-line no-const-assign
    //  shippingToJSON = computed(() => {
    //   return JSON.stringify(newShippingAddress.value);
    // });

    const billingToJSON = computed(() => {
      return JSON.stringify(newBillingAddress.value);
    });

    const shippingToJSON = computed(() => {
      return JSON.stringify(newShippingAddress.value);
    });

    const navigateToUpdate = (token) => {
      console.log("token",token)
      route.push({
        name: 'update', 
        params: { token }, 
      });
    };

    // Lifecycle hook
    onMounted(() => {
      success.value = route.currentRoute.value.params.success || route.currentRoute.value.query.success;
      error.value = route.currentRoute.value.params.error || route.currentRoute.value.query.error;//TODO:modified
    });

    return {
      me,
      billingToJSON,
      shippingToJSON,
      // emitBillingDetails,
      // emitShippingDetails,
      showDiv,
      deleteToken,
      renderFunction,
      ucNext,
      showMyCards,
      onAddressChange,
      showAddress,
      cancelAddress,
      addAddress,
      closeSaveCardMyAccount,
      closeSaveCardMyAccountUC,
      updateBillingAddress,
      validBillingForm,
      customerTokenObjs,
      dfpUrl,
      toggle,
      onMonthChange,
      onYearChange,
      loading,
      customerTokenObjLen,
      showMyAccountFlex,
      isOpenIndex,
      addressesLength,
      showNewAdress,
      showUCTokenAlias,
      showAddressforUC ,
      displayAddresses,
      error,
      updateShippingAddress,
      getMonth,
      expiryYearOption,
      submitCard,
      showCardDetail,
      addresses,
      success,
      navigateToUpdate,
      showUnifiedMethods,
      showUc
    }
  },
};

//   apollo: {
//     me: {
//       query: gql`
//         query me {
//           me {
//             customer {
//               id
//               firstName
//               lastName
//               customerNumber
//               version
//             }
//           }
//         }
//       `,
//     },
//   },
// };
