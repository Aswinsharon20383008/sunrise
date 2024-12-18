/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import jwt_decode from "jwt-decode";
import { onMounted, ref, reactive, emit ,watch} from 'vue';
import { v4 as uuidv4 } from "uuid";
import payments from "./api/payments";
import cartApi from "./api/cart";
import customer from "./api/customer";
import flexStyle from "./FlexMicroformStyle";
import cartMixin from "../../../../../mixins/cartMixin";
// import {updateMyCart} from "../../../../../mixins/cartMixin";
import { Constants } from "./Constants";
import { base64encode } from "nodejs-base64";
import { Buffer } from 'buffer';
import gpay from "./api/googlePay";
import ipAddress from "./api/ipAddress";
import { locale } from '../../../components/common/shared';
import { useStore } from 'vuex';
import useLocale from "hooks/useLocale";
import useCart from 'hooks/useCart';
import { fetchCartData } from "./api/activeCart";
const deviceFingerprintId = uuidv4();
const VisaCheckoutApiKey = process.env.VUE_APP_VISA_CHECKOUT_API_KEY;
const PayerAuthenticationFlag = process.env.VUE_APP_USE_PAYER_AUTHENTICATION;
const saleFlag = process.env.VUE_APP_USE_SALE;
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;
var unifiedCheckoutVariable = "false";
if (undefined != process.env.VUE_APP_USE_UNIFIED_CHECKOUT) {
  unifiedCheckoutVariable = process.env.VUE_APP_USE_UNIFIED_CHECKOUT;
}
const unifiedCheckoutFlag = unifiedCheckoutVariable;
var enableUCBillingAddressVariable = "false";
if (undefined != process.env.VUE_APP_USE_UC_BILLING_ADDRESS) {
  enableUCBillingAddressVariable = process.env.VUE_APP_USE_UC_BILLING_ADDRESS;
}
const enableUCBillingAddress = enableUCBillingAddressVariable;
var enableUCShippingAddressVariable = "false";
if (undefined != process.env.VUE_APP_USE_UC_SHIPPING_ADDRESS) {
  enableUCShippingAddressVariable = process.env.VUE_APP_USE_UC_SHIPPING_ADDRESS;
}
var isSideBarEnabled = "false";
if (undefined != process.env.VUE_APP_USE_UC_SIDE_BAR_CONFIG) {
  isSideBarEnabled = process.env.VUE_APP_USE_UC_SIDE_BAR_CONFIG;
}
const enableUCShippingAddress = enableUCShippingAddressVariable;
const multipleShipping = process.env.VUE_APP_ENABLE_MULTIPLE_SHIPPING;
const scaFlag = process.env.VUE_APP_USE_SCA;
const multiMid = process.env.VUE_APP_USE_MULTI_MID;
var saleFlagEnabled = false;
var dfpUrl = Constants.EMPTY_STRING;
if (Constants.ISV_PAYMENT_ENVIRONMENT_TEST == process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase()) {
  dfpUrl = Constants.DEVICE_FINGERPRINT_URL_TEST + multimidIdentifier + deviceFingerprintId;
} else if (Constants.ISV_PAYMENT_ENVIRONMENT_PRODUCTION == process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase()) {
  dfpUrl = Constants.DEVICE_FINGERPRINT_URL_LIVE + multimidIdentifier + deviceFingerprintId;
}

// console.log('locale', locale);

const createPaymentAsync = async function (paymentDto) {
  return await payments.create(paymentDto);
};

var VisaChktUrl;
var flexSourceUrl;
var DeviceDataCollectionUrl;
var validationCallBackResolve;
var ddcCallbackResolve;
var customerSavedToken;
var applePaySession;
var gpayPaymentsClient = null;
var count = Constants.NUMBER_ZERO;
var tid = null;
if (process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase() == Constants.ISV_PAYMENT_ENVIRONMENT_TEST) {
  VisaChktUrl = Constants.TEST_VISA_CHECKOUT_URL;
  DeviceDataCollectionUrl = Constants.TEST_DEVICE_DATA_COLLECTION_URL;
  flexSourceUrl = Constants.TEST_FLEX_SOURCE_URL;
}

if (process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase() == Constants.ISV_PAYMENT_ENVIRONMENT_PRODUCTION) {
  VisaChktUrl = Constants.PRODUCTION_VISA_CHECKOUT_URL;
  DeviceDataCollectionUrl = Constants.PRODUCTION_DEVICE_DATA_COLLECTION_URL;
  flexSourceUrl = Constants.PRODUCTION_FLEX_SOURCE_URL;
}

const baseRequest = {
  apiVersion: Constants.GOOGLE_PAY_API_VERSION,
  apiVersionMinor: Constants.GOOGLE_PAY_API_VERSION_MINOR,
};

const allowedCardNetworks = Constants.ALLOWED_CARD_NETWORKS;
const allowedCardAuthMethods = Constants.ALLOWED_CARD_AUTH_METHODS;

const tokenizationSpecification = {
  type: Constants.PAYMENT_GATEWAY,
  parameters: {
    gateway: Constants.GATEWAY_NAME,
    gatewayMerchantId: process.env.VUE_APP_USE_GPAY_MERCHANT_ID,
  },
};

const baseCardPaymentMethod = {
  type: Constants.CARD,
  parameters: {
    allowedAuthMethods: allowedCardAuthMethods,
    allowedCardNetworks: allowedCardNetworks,
  },
};

const cardPaymentMethod = Object.assign({}, baseCardPaymentMethod, {
  tokenizationSpecification: tokenizationSpecification,
});

export default {
  name: 'ISVPayment',
  props: {
    amount: Object,
  },
  setup(props, { emit }) {
    let isShow = ref(false);
    let showSavedCard = ref(false);
    let showCreditCard = ref(true);
    let isLoggedIn = ref(false);
    let error = ref('');
    let loading = ref(false);
    let transactionId = ref(null);
    let selectOptions = ref([]);
    let unifiedCheckout = ref(unifiedCheckoutFlag);
    let showUnifiedMethods = ref(false);
    let loggedInCustomer = ref(null);
    let language = ref(null);
    let me = ref({ activeCart: {} }); // Initialize with an empty object or appropriate structure
    let amount = ref(null);
    let store = useStore();
    let customerIpAddress = ref('');
    let errorId = ref(null);
    let showSavedCardforUc = ref(false);
    let showUc = ref(true);
    let visaButtonUrl = ref('');
    const{locale} = useLocale();
    const { cart } = useCart();
    const {updateMyCart} = cartMixin.setup();
    let PaymentMethods = reactive({
      showing: Constants.GOOGLE_PAY,
      flexMicroform: {
        flexMicroFormObject: null,
        jsLoaded: false,
      },
      visaCheckout: {
        jsLoaded: false,
        visaCallId: null,
      },
      googlePay: {
        jsLoaded: false,
        paymentToken: null,
      },
      applePay: {
        showButton: false,
        applePayData: null,
      },
      unifiedCheckout: {
        jsLoaded: false,
        transientToken: null,
      },
    });

    // watch(
    //   () => language,
    //   async (newLanguage) => {

    watch(language, async (newLanguage) => {
      me.value.activeCart = cart.value;
      const cartId = me.value.activeCart.cartId;
      const languageSelected = newLanguage;
      if (cartId && languageSelected) {
        try {
          const cartDetails = await cartApi.get(cartId);
          // Check if the cart version is greater than the local version
          if (cartDetails.version > me.value.activeCart.version) {
            me.value.activeCart = cartDetails;
          }

          // Check if locale needs to be updated
          if ( !cartDetails.locale || cartDetails.locale !== languageSelected
          ) {
          await cartApi.getCart(me.value.activeCart.cartId);
            const result = await updateMyCart({
              setLocale: { locale: languageSelected },
            },me.value.activeCart);
            me.value.activeCart = result.data.updateMyCart;
          }
        } catch (error) {
          console.error("Error updating cart:", error);
        }
      }
    },{ immediate: true } );

    let expiryYearOption = ref([]);


    const savedCardOption = async (divShow) => {
      error.value = null;
      var event = {
        target: {
          value: Constants.FLEX_MICROFORM
        }
      }
      onPaymentMethodChange(event);
      if (Constants.CREDIT_CARD == divShow) {
        showSavedCard.value = false;
        showCreditCard.value = true;
      } else {
        showSavedCard.value = true;
        showCreditCard.value = false;
      }
    };

    const ucSavedCardOption = async (divShow) => {
      error.value = '';
      var event = {
        target: {
          value: Constants.UNIFIED_CHECKOUT
        }
      }
      onPaymentMethodChange(event);
      if (Constants.UNIFIED_CHECKOUT == divShow) {
        showSavedCardforUc.value = false;
        showUc.value = true;
      } else {
        showSavedCardforUc.value = true;
        showUc.value = false;
      }
    };

    const retrieveBrowserInformation = () => {
      let browserInfo = {
        isv_screenHeight: '',
        isv_screenWidth: '',
      }
      browserInfo.isv_screenHeight = window.screen.height;
      browserInfo.isv_screenWidth = window.screen.width;
      return browserInfo;
    };

    const onPaymentMethodChange = async (event) => {
      var customerId;
      var tokenData;
      var customerIdArray;
      var customerIdScope = null;
      var customerData = null;
      error.value = '';
      selectOptions.value = [];
      count = Constants.NUMBER_ZERO;
      try {
        let authenticated = JSON.parse(localStorage.getItem('CUSTOMER'));
        if (authenticated) {
          isLoggedIn.value = true;
          loggedInCustomer.value = authenticated.customerId
          customerData = await customer.getCustomer(authenticated.customerId);
          if (Constants.STRING_CUSTOM in customerData && Constants.STRING_FIELDS in customerData.custom && customerData?.custom?.fields?.isv_tokens) {
            customerSavedToken = customerData.custom.fields.isv_tokens;
            if (customerSavedToken.length > Constants.NUMBER_ZERO) {
              selectOptions.value.push({ value: Constants.STRING_CHOOSE, text: Constants.STRING_CHOOSE });
              customerSavedToken.forEach((token) => {
                tokenData = JSON.parse(token);
                selectOptions.value.push({
                  value: tokenData.paymentToken,
                  text: `${tokenData.alias} (${tokenData.cardName} 
                    ${tokenData.cardNumber} ${tokenData.cardExpiryMonth}/${tokenData.cardExpiryYear})`,
                });
              });
            } else {
              selectOptions.value.push({ value: Constants.EMPTY_STRING, text: Constants.ERROR_MSG_NO_TOKENS });
            }
          } else {
            selectOptions.value.push({ value: Constants.EMPTY_STRING, text: Constants.ERROR_MSG_NO_TOKENS });
          }
        }
      } catch (e) {
        error.value = Constants.ERROR_MSG_PAYMENT_METHOD;
        return;
      }
      await renderPaymentMethod(event.target.value);
    };

    const renderPaymentMethod = async (paymentMethod) => {
      retrieveBrowserInformation();
      var local;
      if (Constants.STRING_TRUE == saleFlag) {
        saleFlagEnabled = true;
      }
      if (null != locale) {
        language.value = locale.value;
      }
      switch (paymentMethod) {
        case Constants.FLEX_MICROFORM:
          await renderFlex();
          break;
        case Constants.VISA_CHECKOUT:
          if (process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase() ==
            Constants.ISV_PAYMENT_ENVIRONMENT_TEST) {
            visaButtonUrl.value = Constants.TEST_VISA_BUTTON_URL;
          } else if (process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase() ==
            Constants.ISV_PAYMENT_ENVIRONMENT_PRODUCTION) {
            visaButtonUrl.value = Constants.PRODUCTION_VISA_BUTTON_URL;
          }
          await renderVisaCheckout();
          break;
        case Constants.GOOGLE_PAY:
          await renderGooglePay();
          break;
        case Constants.APPLE_PAY:
          renderApplePay();
          break;
        case Constants.UNIFIED_CHECKOUT:
          PaymentMethods.unifiedCheckout.jsLoaded = false;
          await renderUnifiedCheckoutWithFetch();
          break;
      }
    };

    const renderUnifiedCheckoutWithFetch = async () => {
      let captureContextResponse;
      let captureContext;
      let captureData;
      let clientLibraryUrl;
      let transientToken;
      const showArgs = {
        containers: {
          paymentSelection: "#buttonPaymentListContainers",
          ...(Constants.STRING_FALSE == isSideBarEnabled && {
            paymentScreen: "#embeddedPaymentContainer",
          }),
        },
      };
      try {
        let multimidId = Constants.EMPTY_STRING;
        if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
          multimidId = multimidIdentifier;
        }
        captureContextResponse = await ipAddress.getCaptureContext(me.value.activeCart?.id || me.value.activeCart?.cartId, multimidId, null, null, null);
        if (Constants.EMPTY_STRING != captureContextResponse) {
          showUnifiedMethods.value = true;
          captureContext = captureContextResponse;
          try {
            captureData = jwt_decode(captureContext);
          } catch (decodeError) {
            console.error('JWT decode error:', decodeError);
            error.value = 'JWT decode error';
            return;
          }
          clientLibraryUrl = captureData?.ctx?.[0]?.data?.clientLibrary;
          if (!clientLibraryUrl) {
            console.error('Client library URL not found in capture data:', captureData);
            error.value = 'Client library URL not found';
            return;
          }

          await appendUnifiedCheckoutJS(clientLibraryUrl);
          // eslint-disable-next-line no-undef
          Accept(captureContext)
          .then((accept) => {
            return Constants.STRING_FALSE == isSideBarEnabled
              ? accept.unifiedPayments(false)
              : accept.unifiedPayments();
          })
            .then(up => up.show(showArgs))
            .then(tt => {
              transientToken = tt;
              PaymentMethods.unifiedCheckout.transientToken = tt;
              placeOrder();
            })
            .catch(e => {
              console.error('Error during payment process:', e);
              error.value = e;
            });
        } else {
          showUnifiedMethods.value = false;
          error.value = Constants.ERROR_MSG_FORM_LOAD;
        }
      } catch (exception) {
        console.error('Exception occurred:', exception);
      }
    };

    const appendUnifiedCheckoutJS = async (clientLibraryUrl) => {
      var unifiedCheckoutScript;
      if (!PaymentMethods.unifiedCheckout.jsLoaded) {
        PaymentMethods.unifiedCheckout.jsLoaded = await new Promise(function (resolve, reject) {
          unifiedCheckoutScript = document.createElement(Constants.STRING_SCRIPT);
          unifiedCheckoutScript.setAttribute(Constants.STRING_SRC, clientLibraryUrl);
          unifiedCheckoutScript.onload = function () {
            resolve(true);
          };
          unifiedCheckoutScript.onerror = function (event) {
            console.log("error")
            reject(event);
          };
          document.head.appendChild(unifiedCheckoutScript);
        });
      }
    };

    const appendFlexJS = async () => {
      var flexScript;
      if (!PaymentMethods.flexMicroform.jsLoaded) {
        PaymentMethods.flexMicroform.jsLoaded = new Promise(function (resolve, reject) {
          flexScript = document.createElement(Constants.STRING_SCRIPT);
          flexScript.setAttribute(Constants.STRING_SRC, flexSourceUrl);
          flexScript.onload = function () {
            resolve(true);
          };
          flexScript.onerror = function (event) {
            reject(event);
          };
          document.head.appendChild(flexScript);
        });
      }
      return PaymentMethods.flexMicroform.jsLoaded;
    };

    const renderFlex = async () => {
      var oldPayment;
      var payment;
      var captureContext;
      var flexInstance;
      var flexMicroform;
      let paymentData = {
        amountPlanned: {
          currencyCode: props.amount.currencyCode,
          centAmount: props.amount.centAmount,
        },
        paymentMethodInfo: {
          paymentInterface: Constants.PAYMENT_INTERFACE,
          method: null,
          name: null,
        },
        custom: {
          type: {
            key: Constants.PAYMENT_INTERFACE_TYPE,
          },
          fields: {},
        },
      };
      let year = new Date().getFullYear();
      let current = year;
      for (var i = Constants.NUMBER_ZERO; i <= Constants.NUMBER_NINE; i++) {
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
      if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
        paymentData.paymentMethodInfo.method = Constants.CC_WITH_PAYER_AUTH;
        paymentData.paymentMethodInfo.name = {
          en: Constants.CC_WITH_PAYER_AUTH_EN,
        };
      } else {
        paymentData.paymentMethodInfo.method = Constants.CREDIT_CARD;
        paymentData.paymentMethodInfo.name = {
          en: Constants.CREDIT_CARD_EN,
        };
      }
      if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
        paymentData.custom.fields.isv_merchantId = multimidIdentifier;
      } else {
        paymentData.custom.fields.isv_merchantId = Constants.EMPTY_STRING;
      }
      oldPayment = store.state.payment;
      oldPayment?.id && payments.delete(oldPayment);
      payment = await createPaymentAsync(paymentData);
      store.dispatch(Constants.STRING_SET_PAYMENT, payment);
      if (payment.errors) {
        loading.value = false;
        if (Constants.NUMBER_FIVE_ZERO_TWO == payment.statusCode) {
          error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
        } else if (Constants.NUMBER_FIVE_ZERO_FOUR == payment.statusCode) {
          error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
        } else {
          error.value = Constants.ERROR_MSG_SUNRISE;
        }
        return;
      }
      if (Constants.ISV_TOKEN_CAPTURE_CONTEXT in payment.custom.fields && Constants.EMPTY_STRING !=
        payment.custom.fields.isv_tokenCaptureContextSignature) {
        captureContext = payment.custom.fields.isv_tokenCaptureContextSignature;
        // Flex comes from flex JS on appendFlexJS()
        // eslint-disable-next-line
        flexInstance = new Flex(captureContext);
        flexMicroform = flexInstance.microform({ styles: flexStyle });
        flexMicroform
          .createField(Constants.STRING_NUMBER, {
            placeholder: Constants.PLACEHOLDER_ENTER_CARD_NO,
          })
          .load("#number-container-1");
        flexMicroform
          .createField(Constants.STRING_SECURITY_CODE, {
            placeholder: Constants.PLACEHOLDER_3DOTS,
          })
          .load("#securityCode-container");
        PaymentMethods.flexMicroform.flexMicroFormObject = flexMicroform
      } else {
        loading.value = false;
        error.value = Constants.ERROR_MSG_FORM_LOAD;
        return;
      }
    };

    const appendVisaCheckoutJS = async () => {
      var visaChktScript;
      if (!PaymentMethods.visaCheckout.jsLoaded) {
        PaymentMethods.visaCheckout.jsLoaded = await new Promise(function (resolve, reject) {
          visaChktScript = document.createElement(Constants.STRING_SCRIPT);
          visaChktScript.setAttribute(Constants.STRING_SRC, VisaChktUrl);
          visaChktScript.onload = function () {
            resolve(true);
          };
          visaChktScript.onerror = function (event) {
            reject(event);
          };
          document.head.appendChild(visaChktScript);
        });
      }
      return PaymentMethods.visaCheckout.jsLoaded;
    };

    const renderGooglePay = async () => {
      gpayPaymentsClient = null;
      await appendGooglePayJS();
      gpay.onGooglePayLoaded(props.amount.currencyCode);
    };

    const appendGooglePayJS = async () => {
      var googlepayScript;
      if (!PaymentMethods.googlePay.jsLoaded) {
        PaymentMethods.googlePay.jsLoaded = new Promise(function (resolve, reject) {
          googlepayScript = document.createElement(Constants.STRING_SCRIPT);
          googlepayScript.setAttribute(Constants.STRING_SRC, Constants.GOOGLE_PAY_URL);
          googlepayScript.onload = function () {
            resolve(true);
          };
          googlepayScript.onerror = function (event) {
            reject(event);
          };
          document.head.appendChild(googlepayScript);
        });
      }
      return PaymentMethods.googlePay.jsLoaded;
    };

    const getGooglePaymentDataRequest = () => {
      const paymentDataRequest = Object.assign({}, baseRequest);
      paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
      paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
      paymentDataRequest.merchantInfo = {
        merchantName: process.env.VUE_APP_USE_GPAY_MERCHANT_ID,
        merchantId: process.env.VUE_APP_USE_GPAY_MERCHANT_ID,
      };
      paymentDataRequest.callbackIntents = Constants.GOOGLE_PAY_CALLBACK_INTENTS;
      return paymentDataRequest;
    };

    const getGoogleIsReadyToPayRequest = () => {
      return Object.assign({},
        baseRequest, {
        allowedPaymentMethods: [baseCardPaymentMethod]
      });
    };

    const getGoogleTransactionInfo = () => {
      var totalprice = ((props.amount.centAmount / Math.pow(10, props.amount.fractionDigits)).toFixed(props.amount.fractionDigits)) * 1;
      return {
        // countryCode: store.state.country,
        countryCode: 'US',
        currencyCode: props.amount.currencyCode,
        totalPriceStatus: Constants.GOOGLE_PAY_TOTAL_PRICE_STATUS,
        totalPrice: totalprice.toString(),
        totalPriceLabel: Constants.GOOGLE_PAY_TOTAL_LABEL,
      };
    };

    const getGooglePaymentsClient = () => {
      if (gpayPaymentsClient === null) {
        //eslint-disable-next-line
        gpayPaymentsClient = new google.payments.api.PaymentsClient({
          environment: process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase(),
          merchantInfo: {
            merchantName: process.env.VUE_APP_USE_GPAY_MERCHANT_NAME,
            merchantId: process.env.VUE_APP_USE_GPAY_MERCHANT_ID
          },
          paymentDataCallbacks: {
            onPaymentAuthorized: onPaymentAuthorized
          }
        });
      }
      return gpayPaymentsClient;
    };

    const onPaymentAuthorized = (paymentData) => {
      return new Promise(function (resolve, reject) {
        processPayment(paymentData)
          .then(function () {
            resolve({
              transactionState: Constants.GOOGLE_PAY_SUCCESS,
            });
          })
          .catch(function (err) {
            console.log(err);
            resolve({
              transactionState: Constants.GOOGLE_PAY_ERROR,
              error: {
                intent: Constants.GOOGLE_PAY_INTENT,
                message: Constants.GOOGLE_PAY_INSUFFICIENT_FUNDS,
                reason: Constants.GOOGLE_PAY_PAYMENT_DATA_INVALID,
              },
            });
          });
      });
    };

    const processPayment = (paymentData) => {
      return new Promise(function (resolve, reject) {
        var paymentToken = paymentData.paymentMethodData.tokenizationData.token;
        PaymentMethods.googlePay.paymentToken = Buffer.from(paymentToken, 'utf8').toString('base64');
        try {
          if (PaymentMethods.googlePay.paymentToken) {
            placeOrder();
          } else {
            error.value = Constants.ERROR_MSG_SUNRISE;
          }
        } catch (e) {
          console.log("error",e)
          error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
        }
        resolve({});
      });
    };

    const renderApplePay = () => {
      error.value = '';
      if (window.ApplePaySession) {
        if (window.ApplePaySession.canMakePayments()) {
          PaymentMethods.applePay.showButton = true;
        } else {
          error.value = Constants.ERROR_MSG_APPLE_PAY_NOT_ACTIVATED;
        }
      } else {
        error.value = Constants.ERROR_MSG_APPLE_PAY_NOT_SUPPORTED;
      }
    };

    const makePaymentApplePay = () => {
      var paymentRequest;
      var session;
      var totalPrice = Constants.FLOAT_ZERO;
      var sunrContext = this;
      totalPrice = (props.amount.centAmount / Constants.NUMBER_HUNDRED).toFixed(Constants.NUMBER_TWO)
        * Constants.NUMBER_ONE;
      paymentRequest = {
        countryCode: store.state.country,
        currencyCode: props.amount.currencyCode,
        total: {
          label: process.env.VUE_APP_APPLE_PAY_DISPLAY_NAME,
          amount: totalPrice,
        },
        supportedNetworks: Constants.APPLE_PAY_SUPPORTED_NETWORKS,
        merchantCapabilities: Constants.APPLE_PAY_MERCHANT_CAPABILITIES,
      };
      // eslint-disable-next-line no-undef
      session = new ApplePaySession(1, paymentRequest);
      applePaySession = session;
      session.onvalidatemerchant = function (event) {
        validateApplePay(event.validationURL, function (merchantSession) {
          session.completeMerchantValidation(JSON.parse(merchantSession));
        });
      };

      session.begin();

      async function validateApplePay(validationUrl, callback) {
        var oldPayment;
        var payment;
        var paymentCustomFields;
        let paymentData = {
          amountPlanned: {
            currencyCode: props.amount.currencyCode,
            centAmount: props.amount.centAmount,
          },
          paymentMethodInfo: {
            paymentInterface: Constants.PAYMENT_INTERFACE,
            method: null,
            name: null,
          },
          custom: {
            type: {
              key: Constants.PAYMENT_INTERFACE_TYPE,
            },
            fields: {},
          },
        };
        paymentData.paymentMethodInfo.method = Constants.APPLE_PAY;
        paymentData.paymentMethodInfo.name = {
          en: Constants.APPLE_PAY_EN,
        };
        var multimidId = Constants.EMPTY_STRING;
        if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
          multimidId = multimidIdentifier;
        } else {
          multimidId = Constants.EMPTY_STRING;
        }
        paymentCustomFields = {
          isv_applePayValidationUrl: validationUrl, //validationURL
          isv_applePayDisplayName: process.env.VUE_APP_APPLE_PAY_DISPLAY_NAME, //displayName
          isv_deviceFingerprintId: deviceFingerprintId,
          isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
          isv_userAgentHeader: navigator.userAgent,
          isv_customerIpAddress: customerIpAddress.value,
          isv_merchantId: multimidId
        };
        paymentData.custom.fields = paymentCustomFields;
        oldPayment = store.state.payment;
        oldPayment?.id && payments.delete(oldPayment);
        payment = await createPaymentAsync(paymentData);
        if (null != payment && Constants.STRING_CUSTOM in payment && Constants.STRING_FIELDS in
          payment.custom && Constants.ISV_PAYMENT_APPLE_PAY_SESSION_DATA in payment.custom.fields) {
          store.dispatch(Constants.STRING_SET_PAYMENT, payment);
          callback(payment.custom.fields.isv_applePaySessionData);
        }
      }
      session.onpaymentauthorized = function (event) {
        var paymentDataString;
        var paymentDataBase64;
        paymentDataString = JSON.stringify(event.payment.token.paymentData);
        paymentDataBase64 = base64encode(paymentDataString);
        PaymentMethods.applePay.applePayData = paymentDataBase64;
        placeOrder(); // here authorization happens
      };

      session.oncancel = function (event) {
        error.value = Constants.ERROR_MSG_APPLE_PAY_SESSION;
      };
    };

    const prepareFlexMicroformPaymentFields = (tokens) => {
      console.log('count', count);
      var microform;
      var options;
      var flexData;
      var paymentCustomFields;
      var multimidId = Constants.EMPTY_STRING;
      if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
        multimidId = multimidIdentifier;
      }
      const browserInfo = retrieveBrowserInformation();
      if (null == tokens && (0 == count || 0 < count)) {
        return new Promise((resolve, reject) => {
          microform = PaymentMethods.flexMicroform.flexMicroFormObject;
          options = {
            expirationMonth: document.querySelector("#expMonth").value,
            expirationYear: document.querySelector("#expYear").value,
          };
          microform.createToken(options, (err, jwtToken) => {
            if (err) {
              reject(err.message);
            } else {
              try {
                flexData = jwt_decode(jwtToken);
                paymentCustomFields = {
                  isv_token: jwtToken,
                  isv_maskedPan: flexData.content.paymentInformation.card.number.bin + flexData.content.paymentInformation.card.number.maskedValue,
                  isv_cardType: flexData.content.paymentInformation.card.number.detectedCardTypes[0],
                  isv_cardExpiryMonth: flexData.content.paymentInformation.card.expirationMonth.value,
                  isv_cardExpiryYear: flexData.content.paymentInformation.card.expirationYear.value,
                  isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
                  isv_deviceFingerprintId: deviceFingerprintId,
                  isv_customerIpAddress: customerIpAddress.value,
                  isv_saleEnabled: saleFlagEnabled,
                  isv_merchantId: multimidId,
                  isv_screenHeight: browserInfo.isv_screenHeight,
                  isv_screenWidth: browserInfo.isv_screenWidth,
                };
                resolve(paymentCustomFields);
              } catch (e) {
                console.log("error",e)
                reject(e);
              }
            }
          });
        });
      } else if (tokens && !count) {
        paymentCustomFields = {
          type: {
            key: Constants.PAYMENT_INTERFACE_TYPE,
          },
          fields: {
            isv_maskedPan: tokens.cardNumber,
            isv_cardType: tokens.cardType,
            isv_cardExpiryMonth: tokens.cardExpiryMonth,
            isv_cardExpiryYear: tokens.cardExpiryYear,
            isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
            isv_userAgentHeader: navigator.userAgent,
            isv_customerIpAddress: customerIpAddress.value,
            isv_saleEnabled: saleFlagEnabled,
            isv_merchantId: multimidId,
            isv_screenHeight: browserInfo.isv_screenHeight,
            isv_screenWidth: browserInfo.isv_screenWidth,
            // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
            // isv_javaEnabled : browserInfo.isv_javaEnabled,
            // isv_browserLanguage : browserInfo.isv_browserLanguage,
            // isv_colorDepth : browserInfo.isv_colorDepth,
            // isv_timeDifference : browserInfo.isv_timeDifference
          },
        }
      } else if (tokens && count) {
        paymentCustomFields = {
          fields: {
            isv_maskedPan: tokens.cardNumber,
            isv_cardType: tokens.cardType,
            isv_cardExpiryMonth: tokens.cardExpiryMonth,
            isv_cardExpiryYear: tokens.cardExpiryYear,
            isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
            isv_userAgentHeader: navigator.userAgent,
            isv_customerIpAddress: customerIpAddress.value,
            isv_saleEnabled: saleFlagEnabled,
            isv_merchantId: multimidId,
            isv_screenHeight: browserInfo.isv_screenHeight,
            isv_screenWidth: browserInfo.isv_screenWidth,
            // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
            // isv_javaEnabled : browserInfo.isv_javaEnabled,
            // isv_browserLanguage : browserInfo.isv_browserLanguage,
            // isv_colorDepth : browserInfo.isv_colorDepth,
            // isv_timeDifference : browserInfo.isv_timeDifference
          }
        }
      }
      return paymentCustomFields;
    };
    const renderVisaCheckout = async () => {
      await appendVisaCheckoutJS();
      await onVisaCheckoutReady();
    };

    const onVisaCheckoutReady = () => {
      // V is defined through renderVisaChkt()
      // eslint-disable-next-line no-undef
      V.init({
        apikey: VisaCheckoutApiKey,
        paymentRequest: {
          currencyCode: props.amount.currencyCode,
          subtotal: props.amount.centAmount,
        },
      });

      // eslint-disable-next-line no-undef
      V.on(Constants.VISA_PAYMENT_SUCCESS, (payment) => {
        PaymentMethods.visaCheckout.visaCallId = payment.callid;
        placeOrder();
      });

      // eslint-disable-next-line no-undef
      V.on(Constants.VISA_PAYMENT_ERROR, (payment, error) => {
        console.log(Constants.VISA_CHECKOUT + Constants.COLON, payment, error);
        error = JSON.stringify(error);
        return;
      });
    };

    const callPayerAuthentication = async (action, inputValue) => {
      var cardinalCollectionForm;
      var cardinal_collection_form_input;
      cardinalCollectionForm = document.querySelector("#cardinal_collection_form");
      cardinalCollectionForm.action = action;
      cardinal_collection_form_input = document.querySelector("#cardinal_collection_form_input");
      cardinal_collection_form_input.value = inputValue;
      cardinalCollectionForm.submit();
      await new Promise(function (resolve) {
        ddcCallbackResolve = resolve;
      });
      return;
    };

    const placeOrder = async () => {
      var stepUpForm;
      var stepUpFormInput;
      var lastPayment;
      var updateResult;
      var visaCheckoutCustomFields;
      var googlePayCustomFields;
      var eCheckCustomFields;
      var payment;
      var lastPaymentState;
      var lastTransaction;
      var updatedCart;
      var applePayStatus;
      var currentDate;
      var currentMonth;
      var currentYear;
      var month;
      var year;
      var failure;
      var thisContext = null;
      var action = null;
      var inputValue = null;
      var paymentId = null;
      var serviceResponse = null;
      var savedToken = null;
      var oldPayment = null;
      var setBillingResult = null;
      var setShippingResult = null;
      var tokenAlias = null;
      var errorFlag = false;
      var transientTokenData;
      var transientToken;
      var securityCode;
      var tokenData;
      var billFlag = false;
      var shipFlag = false;
      var billAndShipFlag = false;
      var payerAuthenticationRequired;
      let paymentCustomFields = {
        id: null,
        version: null,
        body: null,
      };
      let paymentData = {
        amountPlanned: {
          currencyCode: null,
          centAmount: null,
        },
        paymentMethodInfo: {
          name: null,
          paymentInterface: Constants.PAYMENT_INTERFACE,
          method: null,
        },
        custom: null,
      };
      error.value = '';
      tid = null;
      const currentPayMethod = PaymentMethods.showing;
      switch (currentPayMethod) {
        case Constants.FLEX_MICROFORM: {
          loading.value = true;
          try {
            savedToken = document.querySelector("#savedToken").value;
            if (Constants.EMPTY_STRING != savedToken && Constants.STRING_CHOOSE != savedToken) {
              lastPayment = await payments.get(store.state.payment.id);
              if (count > 0) {
                updateResult = await savedTokenCustomFieldsRetry(savedToken, lastPayment);
              } else {
                console.log("line 956",savedToken, lastPayment)
                updateResult = await savedTokenFunc(savedToken, lastPayment);
              }
              console.log("line 959",updateResult)
              paymentId = updateResult.id;
              if (updateResult.errors) {
                loading.value = false;
                if (Constants.NUMBER_FIVE_ZERO_TWO == updateResult.statusCode) {
                  error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
                } else if (Constants.NUMBER_FIVE_ZERO_FOUR == updateResult.statusCode) {
                  error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
                } else {
                  error.value = Constants.ERROR_MSG_SUNRISE;
                }
                return;
              }
            } else {
              lastPayment = await payments.get(store.state.payment.id);
              paymentCustomFields.id = lastPayment.id;
              paymentCustomFields.version = lastPayment.version;
              paymentCustomFields.body = await prepareFlexMicroformPaymentFields(null);
              console.log('paymentCustomFields.body', paymentCustomFields.body)
              month = paymentCustomFields.body.isv_cardExpiryMonth;
              year = paymentCustomFields.body.isv_cardExpiryYear;
              currentDate = new Date();
              currentMonth = currentDate.getMonth() + Constants.NUMBER_ONE;
              currentYear = currentDate.getFullYear();
              if (year == currentYear) {
                if (month < currentMonth) {
                  errorFlag = true;
                }
              }
              if (errorFlag) {
                loading.value = false;
                error.value = Constants.ERROR_MSG_INVALID_EXPIRY_DATE;
                return;
              } else {
                tokenAlias = document.querySelector("#tokenAlias").value;
                if (tokenAlias) {
                  await addAddress();
                  paymentCustomFields.body.tokenAlias = tokenAlias;
                  updateResult = await payments.updateWithTokenAlias(paymentCustomFields);
                } else {
                  updateResult = await payments.update(paymentCustomFields);
                 
                }
                if (updateResult.errors) {
                  loading.value = false;
                  if (Constants.NUMBER_FIVE_ZERO_TWO == updateResult.statusCode) {
                    error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
                  } else if (Constants.NUMBER_FIVE_ZERO_FOUR == updateResult.statusCode) {
                    error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
                  } else {
                    error.value = Constants.ERROR_MSG_SUNRISE;
                  }
                  return;
                }
              }
            }
            if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
              if (Constants.STRING_TRUE == multipleShipping) {
                setBillingResult = await setCartBillingAddressMultiple();
                if (null == setBillingResult) {
                  loading.value = false;
                  error.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
                  return;
                } else {
                  loading.value = true;
                }
              } else {
                setBillingResult = await setCartBillingAddress();
                setShippingResult = await setCartShippingAddress();
                if (null == setBillingResult && null == setShippingResult) {
                  loading.value = false;
                  error.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
                  return;
                } else {
                  loading.value = true;
                }
              }
              if (Constants.ISV_DDC_URL in updateResult.custom.fields && Constants.ISV_REQUEST_JWT in
                updateResult.custom.fields) {
                action = updateResult.custom.fields.isv_deviceDataCollectionUrl;
                inputValue = updateResult.custom.fields.isv_requestJwt;
                await callPayerAuthentication(action, inputValue);
                updateResult = await updateBrowserInfo(updateResult);
                if (updateResult.errors) {
                  loading.value = false;
                  if (Constants.NUMBER_FIVE_ZERO_TWO == updateResult.statusCode) {
                    error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
                  } else if (Constants.NUMBER_FIVE_ZERO_FOUR == updateResult.statusCode) {
                    error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
                  } else {
                    error.value = Constants.ERROR_MSG_SUNRISE;
                  }
                  return;
                }
                if (Constants.ISV_PAYER_AUTHENTICATION_REQUIRED in updateResult.custom.fields) {
                  payerAuthenticationRequired = updateResult.custom.fields.isv_payerAuthenticationRequired;
                  if (count == Constants.NUMBER_ZERO && Constants.HTTP_CODE_TWO_HUNDRED_ONE ==
                    updateResult.custom.fields.isv_payerEnrollHttpCode &&
                    Constants.API_STATUS_CUSTOMER_AUTHENTICATION_REQUIRED ==
                    updateResult.custom.fields.isv_payerEnrollStatus) {
                    count = count + Constants.NUMBER_ONE;
                    if ((tokenAlias == null || tokenAlias == '')) {
                      count = count + Constants.NUMBER_ONE;
                      await placeOrder();
                    }
                    else if ((tokenAlias != null || tokenAlias != '') && scaFlag == 'false') {
                      count = count + Constants.NUMBER_ONE;
                      await placeOrder();
                    }
                  }
                  if (payerAuthenticationRequired) {
                    if (Constants.ISV_STEPUP_URL in updateResult.custom.fields &&
                      Constants.ISV_RESPONSE_JWT in updateResult.custom.fields) {
                      stepUpForm = document.querySelector("#step-up-form");
                      stepUpForm.action = updateResult.custom.fields.isv_stepUpUrl;
                      stepUpFormInput = document.querySelector("#step-up-formInput");
                      stepUpFormInput.value = encodeURIComponent(updateResult.custom.fields.isv_responseJwt);
                      document.querySelector("#step-up-form").submit();
                      loading.value = false;
                      isShow.value = true;
                      await new Promise(function (resolve) {
                        validationCallBackResolve = resolve;
                      });
                    } else {
                      loading.value = false;
                      error.value = Constants.ERROR_MSG_SUNRISE;
                      return;
                    }
                  }
                } else {
                  loading.value = false;
                  error.value = Constants.ERROR_MSG_SUNRISE;
                  return;
                }
              } else {
                loading.value = false;
                error.value = Constants.ERROR_MSG_SUNRISE;
                return;
              }
              if (payerAuthenticationRequired && Constants.ISV_PAYER_AUTHENTICATION_TRANSACTION_ID
                in updateResult.custom.fields) {
                paymentCustomFields.id = updateResult.id;
                paymentCustomFields.version = updateResult.version;
                paymentCustomFields.body = tid;
                updateResult = await payments.updateTransactionId(paymentCustomFields);
                if (payerAuthenticationRequired && count == Constants.NUMBER_ZERO &&
                  Constants.HTTP_CODE_TWO_HUNDRED_ONE == updateResult.custom.fields.isv_payerEnrollHttpCode
                  && Constants.API_STATUS_CUSTOMER_AUTHENTICATION_REQUIRED ==
                  updateResult.custom.fields.isv_payerEnrollStatus) {
                  if ((tokenAlias == null || tokenAlias == '')) {
                    count = count + Constants.NUMBER_ONE;
                    await placeOrder();
                  }
                  else if ((tokenAlias != null || tokenAlias != '') && scaFlag == 'false') {
                    count = count + Constants.NUMBER_ONE;
                    await placeOrder();
                  }
                }
              }
            }
            paymentId = updateResult.id;
          } catch (e) {
            console.log(e);
            loading.value = false;
            error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
            return;
          }
          break;
        }
        case Constants.VISA_CHECKOUT: {
          loading.value = true;
          paymentData.amountPlanned.currencyCode = props.amount.currencyCode;
          paymentData.amountPlanned.centAmount = props.amount.centAmount;
          try {
            visaCheckoutCustomFields = await prepareVisaCheckoutPaymentFields();
            paymentData.paymentMethodInfo.method = Constants.VISA_CHECKOUT;
            paymentData.paymentMethodInfo.name = {
              en: Constants.VISA_CHECKOUT_EN,
            };
            paymentData.custom = visaCheckoutCustomFields;
          } catch (e) {
            console.log("error",e)
            loading.value = false;
            error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
            return;
          }
          oldPayment = store.state.payment;
          oldPayment?.id && payments.delete(oldPayment);
          payment = await createPaymentAsync(paymentData);
          store.dispatch(Constants.STRING_SET_PAYMENT, payment);
          paymentId = payment.id;
          if (payment.errors) {
            loading.value = false;
            if (Constants.NUMBER_FIVE_ZERO_TWO == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
            } else if (Constants.NUMBER_FIVE_ZERO_FOUR == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
            } else {
              error.value = Constants.ERROR_MSG_SUNRISE;
            }
            return;
          }
          break;
        }
        case Constants.GOOGLE_PAY: {
          loading.value = true;
          paymentData.amountPlanned.currencyCode = props.amount.currencyCode;
          paymentData.amountPlanned.centAmount = props.amount.centAmount;
          try {
            googlePayCustomFields = await prepareGooglePayPaymentFields();
            paymentData.paymentMethodInfo.method = Constants.GOOGLE_PAY;
            paymentData.paymentMethodInfo.name = {
              en: Constants.GOOGLE_PAY_EN,
            };
            paymentData.custom = googlePayCustomFields;
          } catch (e) {
            console.log(e)
            loading.value = false;
            error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
            return;
          }
          oldPayment = store.state.payment;
          oldPayment?.id && payments.delete(oldPayment);
          payment = await createPaymentAsync(paymentData);
          store.dispatch(Constants.STRING_SET_PAYMENT, payment);
          paymentId = payment.id;
          if (payment.errors) {
            loading.value = false;
            if (Constants.NUMBER_FIVE_ZERO_TWO == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
            } else if (Constants.NUMBER_FIVE_ZERO_FOUR == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
            } else {
              error.value = Constants.ERROR_MSG_SUNRISE;
            }
            return;
          }
          break;
        }
        case Constants.APPLE_PAY: {
          try {
            if (PaymentMethods.applePay.applePayData) {
              lastPayment = await payments.get(store.state.payment.id);
              paymentCustomFields.id = lastPayment.id;
              paymentCustomFields.version = lastPayment.version;
              paymentCustomFields.body = PaymentMethods.applePay.applePayData;
              paymentCustomFields.sale = saleFlagEnabled;
              updateResult = await payments.updateApplePayToken(paymentCustomFields);
              paymentId = updateResult.id;
              if (updateResult.errors) {
                errorFlag = true;
              }
            } else {
              errorFlag = true;
            }
          } catch (e) {
            console.log("error",e)
            errorFlag = true;
            console.log(e);
          }
          if (errorFlag) {
            // eslint-disable-next-line no-undef
            applePayStatus = ApplePaySession.STATUS_FAILURE;
            applePaySession.completePayment(applePayStatus);
            loading.value = false;
            if (Constants.NUMBER_FIVE_ZERO_TWO == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
            } else if (Constants.NUMBER_FIVE_ZERO_FOUR == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
            } else {
              error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
            }
            return;
          }
          break;
        }
        case Constants.ECHECK: {
          loading.value = true;
          paymentData.amountPlanned.currencyCode = props.amount.currencyCode;
          paymentData.amountPlanned.centAmount = props.amount.centAmount;
          try {
            eCheckCustomFields = await prepareECheckCustomFields();
            paymentData.paymentMethodInfo.method = Constants.ECHECK;
            paymentData.paymentMethodInfo.name = {
              en: Constants.ECHECK,
            };
            paymentData.custom = eCheckCustomFields;
          } catch (e) {
            loading.value = false;
            error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
            return;
          }
          oldPayment = store.state.payment;
          oldPayment?.id && payments.delete(oldPayment);
          payment = await createPaymentAsync(paymentData);
          store.dispatch(Constants.STRING_SET_PAYMENT, payment);
          paymentId = payment.id;
          if (payment.errors) {
            loading.value = false;
            if (Constants.NUMBER_FIVE_ZERO_TWO == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
            } else if (Constants.NUMBER_FIVE_ZERO_FOUR == payment.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
            } else {
              error.value = Constants.ERROR_MSG_SUNRISE;
            }
            return;
          }
          break;
        }
        case Constants.UNIFIED_CHECKOUT: {
          loading.value = true;
          thisContext = this;
          try {
            savedToken = document.querySelector("#ucSavedToken").value;
            if (Constants.EMPTY_STRING != savedToken && Constants.STRING_CHOOSE != savedToken) {//paying with saved card
              paymentData.amountPlanned.currencyCode = props.amount.currencyCode;
              paymentData.amountPlanned.centAmount = props.amount.centAmount;
              if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
                paymentData.paymentMethodInfo.method = Constants.CC_WITH_PAYER_AUTH;
                paymentData.paymentMethodInfo.name = {
                  en: Constants.CC_WITH_PAYER_AUTH_EN,
                };
              } else {
                paymentData.paymentMethodInfo.method = Constants.CREDIT_CARD;
                paymentData.paymentMethodInfo.name = {
                  en: Constants.CREDIT_CARD_EN,
                };
              }
              if (customerSavedToken.length > Constants.NUMBER_ZERO) {
                securityCode = document.querySelector("#ucSecurityCode").value,
                  await customerSavedToken.forEach(async (token) => {
                    tokenData = JSON.parse(token);
                    if (tokenData.paymentToken == savedToken) {
                      paymentData.custom = await prepareUnifiedCheckoutCardCustomFields(tokenData);
                      console.log("paymentdata custom",paymentData)
                    }
                  });
                if (securityCode) {
                  paymentData.custom.fields.isv_securityCode = Number(securityCode);
                }
              }
            } else {
              transientToken = PaymentMethods.unifiedCheckout.transientToken;
              transientTokenData = jwt_decode(transientToken);
              paymentData.amountPlanned.currencyCode = props.amount.currencyCode;
              paymentData.amountPlanned.centAmount = props.amount.centAmount;
              if ('processingInformation' in transientTokenData.content) {
                if (transientTokenData.content.processingInformation.paymentSolution.value == '012') {
                  paymentData.paymentMethodInfo.method = Constants.GOOGLE_PAY;
                  paymentData.paymentMethodInfo.name = {
                    en: Constants.GOOGLE_PAY_EN,
                  };
                }
                else if (transientTokenData.content.processingInformation.paymentSolution.value == '027') {
                  paymentData.paymentMethodInfo.method = Constants.VISA_CHECKOUT;
                  paymentData.paymentMethodInfo.name = {
                    en: Constants.VISA_CHECKOUT_EN,
                  };
                }
              }
              else {
                if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
                  paymentData.paymentMethodInfo.method = Constants.CC_WITH_PAYER_AUTH;
                  paymentData.paymentMethodInfo.name = {
                    en: Constants.CC_WITH_PAYER_AUTH_EN,
                  };
                } else {
                  paymentData.paymentMethodInfo.method = Constants.CREDIT_CARD;
                  paymentData.paymentMethodInfo.name = {
                    en: Constants.CREDIT_CARD_EN,
                  };
                }
              }
              if (Constants.STRING_CARD in transientTokenData.content.paymentInformation) {
                paymentData.custom = await prepareUnifiedCheckoutCardCustomFields(null);
                tokenAlias = document.querySelector("#ucTokenAlias").value;
                if (tokenAlias) {
                  paymentData.custom.fields.isv_tokenAlias = tokenAlias;
                }
              }
              else {
                paymentData.custom = await prepareGpayUnifiedCheckoutwithoutCardCustomFields();
              }
            }
          } catch (e) {
            console.log("error",e)
            loading.value = false;
            error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
            return;
          }
          if (count == 0) {
            oldPayment = store.state.payment;
            oldPayment?.id && payments.delete(oldPayment);
            payment = await createPaymentAsync(paymentData);
            store.dispatch(Constants.STRING_SET_PAYMENT, payment);
            paymentId = payment.id;
            if (payment.errors) {
              loading.value = false;
              if (Constants.NUMBER_FIVE_ZERO_TWO == payment.statusCode) {
                error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
              } else if (Constants.NUMBER_FIVE_ZERO_FOUR == payment.statusCode) {
                error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
              } else {
                error.value = Constants.ERROR_MSG_SUNRISE;
              }
              return;
            }
            paymentCustomFields.id = payment.id;
            paymentCustomFields.version = payment.version;
            paymentCustomFields.body = {
              isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
              isv_userAgentHeader: navigator.userAgent,
              isv_customerIpAddress: customerIpAddress.value,
              isv_deviceFingerprintId: deviceFingerprintId,
            }
          }
          else {
            lastPayment = await payments.get(store.state.payment.id);
            paymentCustomFields.id = lastPayment.id;
            paymentCustomFields.version = lastPayment.version;

            paymentCustomFields.body = {
              isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
              isv_userAgentHeader: navigator.userAgent,
              isv_customerIpAddress: customerIpAddress.value,
              isv_deviceFingerprintId: deviceFingerprintId,
            }
          }
          if (Constants.STRING_TRUE == PayerAuthenticationFlag && Constants.CC_WITH_PAYER_AUTH == paymentData.paymentMethodInfo.method) {
            updateResult = await payments.updateCustomFields(paymentCustomFields);
            if (updateResult.errors) {
              loading.value = false;
              if (Constants.NUMBER_FIVE_ZERO_TWO == payment.statusCode) {
                loading.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
              } else if (Constants.NUMBER_FIVE_ZERO_FOUR == payment.statusCode) {
                loading.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
              } else {
                loading.value = Constants.ERROR_MSG_SUNRISE;
              }
              return;
            }

            if (Constants.STRING_TRUE == PayerAuthenticationFlag && Constants.CC_WITH_PAYER_AUTH == paymentData.paymentMethodInfo.method) {
              if (Constants.STRING_TRUE == multipleShipping) {
                setBillingResult = await setCartBillingAddressMultiple();
                if (null == setBillingResult) {
                  loading.value = false;
                  error.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
                  return;
                } else {
                  loading.value = true;
                }
              }
              else {
                if (Constants.STRING_TRUE == enableUCBillingAddress && Constants.STRING_TRUE == enableUCShippingAddress) {
                  if (updateResult?.custom?.fields?.isv_savedToken) {
                    setBillingResult = await setCartBillingAddress();
                    setShippingResult = await setCartShippingAddress();
                    if (null == setBillingResult && null == setShippingResult) {
                      loading.value = false;
                      loading.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
                      return;
                    } else {
                      loading.value = true;
                    }
                  }
                } else {
                  if (Constants.STRING_TRUE == enableUCBillingAddress) {
                    if (updateResult?.custom?.fields?.isv_savedToken) {
                      setBillingResult = await setCartBillingAddress();
                      billFlag = true;
                    } else {
                      console.log("DO NOTHING FOR BILLING");
                    }
                  } else {
                    setBillingResult = await setCartBillingAddress();
                    billFlag = true;
                  }
                  if (Constants.STRING_TRUE == enableUCShippingAddress) {
                    if (updateResult?.custom?.fields?.isv_savedToken) {
                      setBillingResult = await setCartShippingAddress();
                      shipFlag = true;
                    } else {
                      console.log("DO NOTHING for SHIPPING");
                    }
                  } else {
                    setShippingResult = await setCartShippingAddress();
                    shipFlag = true;
                  }
                  if (billFlag && shipFlag) {
                    if (null == setBillingResult && null == setShippingResult) {
                      loading.value = false;
                      loading.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
                      return;
                    } else {
                      loading.value = true;
                    }

                  } else if (billFlag) {
                    if (null == setBillingResult) {
                      loading.value = false;
                      loading.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
                      return;
                    } else {
                      loading.value = true;
                    }
                  } else if (shipFlag) {
                    if (null == setShippingResult) {
                      loading.value = false;
                      loading.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
                      return;
                    } else {
                      loading.value = true;
                    }
                  } else {
                    console.log("FINAL ELSE PART");
                  }
                }
                if (Constants.ISV_DDC_URL in updateResult.custom.fields && Constants.ISV_REQUEST_JWT in updateResult.custom.fields) {
                  action = updateResult.custom.fields.isv_deviceDataCollectionUrl;
                  inputValue = updateResult.custom.fields.isv_requestJwt;
                  await callPayerAuthentication(action, inputValue);
                  updateResult = await updateBrowserInfo(updateResult);
                  if (updateResult.errors) {
                    loading.value = false;
                    if (Constants.NUMBER_FIVE_ZERO_TWO == updateResult.statusCode) {
                      loading.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
                    } else if (Constants.NUMBER_FIVE_ZERO_FOUR == updateResult.statusCode) {
                      loading.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
                    } else {
                      loading.value = Constants.ERROR_MSG_SUNRISE;
                    }
                    return;
                  }
                  if (Constants.ISV_PAYER_AUTHENTICATION_REQUIRED in updateResult.custom.fields) {
                    payerAuthenticationRequired = updateResult.custom.fields.isv_payerAuthenticationRequired;
                    if (count == Constants.NUMBER_ZERO && Constants.HTTP_CODE_TWO_HUNDRED_ONE == updateResult.custom.fields.isv_payerEnrollHttpCode && Constants.API_STATUS_CUSTOMER_AUTHENTICATION_REQUIRED == updateResult.custom.fields.isv_payerEnrollStatus) {
                      count = count + Constants.NUMBER_ONE;
                      await placeOrder();
                    }
                  }
                  if (payerAuthenticationRequired) {
                    if (Constants.ISV_STEPUP_URL in updateResult.custom.fields && Constants.ISV_RESPONSE_JWT in updateResult.custom.fields) {
                      stepUpForm = document.querySelector("#step-up-form");
                      stepUpForm.action = updateResult.custom.fields.isv_stepUpUrl;
                      stepUpFormInput = document.querySelector("#step-up-formInput");
                      stepUpFormInput.value = encodeURIComponent(updateResult.custom.fields.isv_responseJwt);
                      document.querySelector("#step-up-form").submit();
                      loading.value = false;
                      isShow.value = true;
                      await new Promise(function (resolve) {
                        validationCallBackResolve = resolve;
                      });
                    } else {
                      loading.value = false;
                      loading.value = Constants.ERROR_MSG_SUNRISE;
                      return;
                    }
                  }
                } else {
                  loading.value = false;
                  loading.value = Constants.ERROR_MSG_SUNRISE;
                  return;
                }
              }
            }
            if (payerAuthenticationRequired && Constants.ISV_PAYER_AUTHENTICATION_TRANSACTION_ID in updateResult.custom.fields) {
              paymentCustomFields.id = updateResult.id;
              paymentCustomFields.version = updateResult.version;
              paymentCustomFields.body = tid;
              updateResult = await payments.updateTransactionId(paymentCustomFields);
              if (payerAuthenticationRequired && count == Constants.NUMBER_ZERO && Constants.HTTP_CODE_TWO_HUNDRED_ONE == updateResult.custom.fields.isv_payerEnrollHttpCode && Constants.API_STATUS_CUSTOMER_AUTHENTICATION_REQUIRED == updateResult.custom.fields.isv_payerEnrollStatus) {
                if ((tokenAlias == null || tokenAlias == '')) {
                  count = count + Constants.NUMBER_ONE;
                  await placeOrder();
                }
                else if ((tokenAlias != null || tokenAlias != '') && scaFlag == 'false') {
                  count = count + Constants.NUMBER_ONE;
                  await placeOrder();
                }
              }
            }
          }
          break;
        }
        default:
          throw new Error(currentPayMethod + Constants.ERROR_MSG_NOT_RECOGNIZED);
      }
      try{
      emit("card-paid", paymentId, {
        onValidationError: () => {
          loading.value = false;
        },
        beforeCompleteAsync: async (result,paymentid) => {
          loading.value = true;
          lastPaymentState = await payments.get(paymentId?paymentId:paymentid);
          if (saleFlagEnabled || currentPayMethod == Constants.ECHECK) {
            serviceResponse = await payments.addSaleTransaction(lastPaymentState);
          } else {
            serviceResponse = await payments.addTransaction(lastPaymentState);
          }
          console.log("serv resp",serviceResponse)
          if (serviceResponse.errors) {
            loading.value = false;
            if (Constants.NUMBER_FIVE_ZERO_TWO == serviceResponse.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_TWO;
            } else if (Constants.NUMBER_FIVE_ZERO_FOUR == serviceResponse.statusCode) {
              error.value = Constants.ERROR_MSG_FIVE_ZERO_FOUR;
            } else {
              error.value = Constants.ERROR_MSG_SUNRISE;
            }
            throw new Error(error.value);
          }
          failure = false;
          serviceResponse.transactions.forEach((transaction) => {
            if (transaction.state === Constants.FAILURE || transaction.state === Constants.INITIAL) {
              failure = true;
              lastTransaction = transaction;
              return;
            }
          });
          if (failure) {
            loading.value = false;
            error.value = Constants.ERROR_MSG_SUNRISE;
            if (lastTransaction) {
              //thisContext.error += ` ${lastTransaction.id}`;
              errorId.value = `${serviceResponse.id}`;
            }
            if (PaymentMethods.showing == Constants.APPLE_PAY) {
              // eslint-disable-next-line no-undef
              applePayStatus = ApplePaySession.STATUS_FAILURE;
              applePaySession.completePayment(applePayStatus);
            }
            throw new Error(error.value);
          }
          if (PaymentMethods.showing == Constants.APPLE_PAY) {
            // eslint-disable-next-line no-undef
            applePayStatus = ApplePaySession.STATUS_SUCCESS;
            applePaySession.completePayment(applePayStatus);
          }
          console.log("Result",JSON.stringify(result))
          updatedCart = await cartApi.get(result.id);
          if (updatedCart.version != result.version) {
            // eslint-disable-next-line no-param-reassign
            result = updatedCart;
          }
          return result;
        },
        afterComplete: () => {
          loading.value = false;
        },
      });}
      catch(e){
        console.log("error from place order",e)
      }
    };
    const updateBrowserInfo = async (updateResult) => {
      var updateTokenResult;
      let paymentCustomFields = {
        id: null,
        version: null,
        userAgentHeader: null,
        screenHeight: null,
        screenWidth: null
      };
      const browserInfo = retrieveBrowserInformation();
      try {
        paymentCustomFields.id = updateResult.id;
        paymentCustomFields.version = updateResult.version;
        paymentCustomFields.userAgentHeader = navigator.userAgent;
        paymentCustomFields.screenHeight = browserInfo.isv_screenHeight;
        paymentCustomFields.screenWidth = browserInfo.isv_screenWidth;
        updateTokenResult = payments.updateUserAgent(paymentCustomFields);
      } catch (e) {
        loading.value = false;
        loading.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
        return;
      }
      return updateTokenResult;
    };

    const savedTokenFunc = async (savedToken,lastPayment) => {
      var updateResult;
      var oldPayment;
      var tokenData;
      var securityCode;
      var isvSavedToken = null;
      var isvTokenAlias = null;
      let paymentData = {
        amountPlanned: {
          currencyCode: null,
          centAmount: null,
        },
        paymentMethodInfo: {
          name: null,
          paymentInterface: Constants.PAYMENT_INTERFACE,
          method: null,
        },
        custom: {},
      };
      let paymentCustomFields = {
        id: null,
        version: null,
        body: null,
      };
      try {
        paymentData.amountPlanned.currencyCode = lastPayment.amountPlanned.currencyCode;
        paymentData.amountPlanned.centAmount = lastPayment.amountPlanned.centAmount;
        oldPayment = store.state.payment;
        oldPayment?.id && payments.delete(oldPayment);
        if (customerSavedToken.length > Constants.NUMBER_ZERO) {
          customerSavedToken.forEach((token) => {
            tokenData = JSON.parse(token);
            if (tokenData.paymentToken == savedToken) {
              paymentData.custom = prepareFlexMicroformPaymentFields(tokenData);
              isvSavedToken = tokenData.paymentToken;
              isvTokenAlias = tokenData.alias;
            }
          });
        }
        if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
          paymentData.paymentMethodInfo.method = Constants.CC_WITH_PAYER_AUTH;
          paymentData.paymentMethodInfo.name = {
            en: Constants.CC_WITH_PAYER_AUTH_EN,
          };
        } else {
          paymentData.paymentMethodInfo.method = Constants.CREDIT_CARD;
          paymentData.paymentMethodInfo.name = {
            en: Constants.CREDIT_CARD_EN,
          };
        }
        updateResult = await createPaymentAsync(paymentData);
        store.dispatch(Constants.STRING_SET_PAYMENT, updateResult);
        if (!(Constants.STRING_ERRORS in updateResult)) {
          securityCode = document.querySelector("#securityCode").value;
          paymentCustomFields.id = updateResult.id;
          paymentCustomFields.version = updateResult.version;
          paymentCustomFields.body = {
            isv_savedToken: isvSavedToken,
            isv_tokenAlias: isvTokenAlias,
            isv_deviceFingerprintId: deviceFingerprintId,
            isv_securityCode: Number(securityCode),
          };
          updateResult = await payments.updateSaveToken(paymentCustomFields);
        }
      } catch (e) {
        loading.value = false;
        loading.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
        return;
      }
      return updateResult;
    };

    const setCartBillingAddressMultiple = async () => {
      loading.value = true;
      var address;
      var billingAddress;
      var cartBillingObject;
      var billingObject = {
        id: me.value.activeCart.id,
        version: me.value.activeCart.version,
        body: {}
      }
      if (Constants.STRING_TRUE == enableUCBillingAddress && Constants.STRING_TRUE == unifiedCheckoutFlag && Constants.STRING_TRUE == PayerAuthenticationFlag) {
        var cartObject = await cartApi.get(me?.value?.activeCart?.id || me?.value?.activeCart?.cartId);
        // this.me.activeCart.version = cartObject.version;
        me.value.activeCart = {
          ...me.value.activeCart,
          version:cartObject.version
        }
        if (null != cartObject && undefined != cartObject && cartObject?.billingAddress && cartObject?.billingAddress?.firstName) {
          billingObject.body.firstName = cartObject.billingAddress.firstName;
          billingObject.body.lastName = cartObject.billingAddress.lastName;
          billingObject.body.streetName = cartObject.billingAddress.streetName;
          billingObject.body.additionalStreetInfo = cartObject?.additionalStreetInfo || '';
          billingObject.body.city = cartObject.billingAddress.city;
          billingObject.body.postalCode = cartObject.billingAddress.postalCode;
          billingObject.body.region = cartObject.billingAddress.region;
          billingObject.body.country = cartObject.billingAddress.country;
          billingObject.body.email = cartObject.billingAddress.email;
          billingObject.body.phone = cartObject.billingAddress.phone;
          cartBillingObject = await cartApi.setBillingAddress(billingObject);
          me.value.activeCart = cartBillingObject;
          return cartBillingObject;
        }
      }
      else if (store.state.validBillingForm) {
        address = store.state.billingAddress;
        billingObject.body.firstName = address.firstName;
        billingObject.body.lastName = address.lastName;
        billingObject.body.streetName = address.streetName;
        billingObject.body.additionalStreetInfo = address?.additionalStreetInfo || '';
        billingObject.body.city = address.city;
        billingObject.body.postalCode = address.postalCode;
        billingObject.body.region = address.region;
        billingObject.body.country = address.country;
        billingObject.body.email = address.email;
        billingObject.body.phone = address.phone;
        cartBillingObject = await cartApi.setBillingAddress(billingObject);
        me.value.activeCart = cartBillingObject;
        return cartBillingObject;
      }
    };

    const setCartBillingAddress = async () => {
      var address;
      var billingAddress;
      var cartObject = await cartApi.get(me?.value?.activeCart?.id || me?.value?.activeCart?.cartId);
      // me.value.activeCart.version = cartObject.version;
      me.value.activeCart = {
        ...me.value.activeCart,
        version:cartObject.version
      }
      // if (Constants.STRING_TRUE == enableUCBillingAddress && Constants.STRING_TRUE == unifiedCheckoutFlag && Constants.STRING_TRUE == PayerAuthenticationFlag &&
      //   null != cartObject && undefined != cartObject && cartObject?.billingAddress && null != cartObject.billingAddress.firstName && undefined != cartObject.billingAddress.firstName) {
      //   billingAddress = {
      //     firstName: cartObject.billingAddress.firstName,
      //     lastName: cartObject.billingAddress.lastName,
      //     streetName: cartObject.billingAddress.streetName,
      //     additionalStreetInfo: cartObject?.billingAddress.additionalStreetInfo || '',
      //     city: cartObject.billingAddress.city,
      //     postalCode: cartObject.billingAddress.postalCode,
      //     region: cartObject.billingAddress.region,
      //     country: cartObject.billingAddress.country,
      //     email: cartObject.billingAddress.email,
      //     phone: cartObject.billingAddress.phone
      //   };
      // }
         //TODO: error fix
      if (store.state.validBillingForm) {
        address = store.state.billingAddress;
        billingAddress = {
          firstName: address.firstName,
          lastName: address.lastName,
          streetName: address.streetName,
          additionalStreetInfo: address?.additionalStreetInfo || '',
          city: address.city,
          postalCode: address.postalCode,
          region: address.region,
          country: address.country,
          email: address.email,
          phone: address.phone
        };
        return updateMyCart([
          {
            setBillingAddress: {
              address: billingAddress,
            },
          },
        ],me.value.activeCart);

      }
    }

    const setCartShippingAddress = async () => {
      var address;
      var billingAddress;
      var cartObject = await cartApi.get(me?.value?.activeCart?.id || me?.value?.activeCart?.cartId);
      // me.value.activeCart.version = cartObject.version;
      me.value.activeCart = {
        ...me.value.activeCart,
        version:cartObject.version
      }
      // if (Constants.STRING_TRUE == enableUCShippingAddress && Constants.STRING_TRUE == unifiedCheckoutFlag && Constants.STRING_TRUE == PayerAuthenticationFlag &&
      //   null != cartObject && undefined != cartObject && cartObject?.shippingAddress && cartObject.shippingAddress?.firstName) {
      //   billingAddress = {
      //     firstName: cartObject.shippingAddress.firstName,
      //     lastName: cartObject.shippingAddress.lastName,
      //     streetName: cartObject.shippingAddress.streetName,
      //     additionalStreetInfo: cartObject?.shippingAddress.additionalStreetInfo || '',
      //     city: cartObject.shippingAddress.city,
      //     postalCode: cartObject.shippingAddress.postalCode,
      //     region: cartObject.shippingAddress.region,
      //     country: cartObject.shippingAddress.country,
      //     email: cartObject.shippingAddress.email,
      //     phone: cartObject.shippingAddress.phone
      //   };
      // }
         //TODO: error fix
     if (store.state.validShippingForm) {
        address = store.state.shippingAddress;//todo:set shippingAddress
        if (null != address) {
          billingAddress = {
            firstName: address.firstName,
            lastName: address.lastName,
            streetName: address.streetName,
            additionalStreetInfo: address?.additionalStreetInfo || '',
            city: address.city,
            postalCode: address.postalCode,
            region: address.region,
            country: address.country,
            email: address.email,
            phone: address.phone
          };
          return updateMyCart([
            {
              setShippingAddress: {
                address: billingAddress,
              },
            },
          ],me.value.activeCart);
        } else {
          /* eslint no-underscore-dangle: ["error", { "allow": ["__vue__"] }]*/
          if (store.state.validBillingForm) {
            address = store.state.billingAddress;
            billingAddress = {
              firstName: address.firstName,
              lastName: address.lastName,
              streetName: address.streetName,
              additionalStreetInfo: address?.additionalStreetInfo || '',
              city: address.city,
              postalCode: address.postalCode,
              region: address.region,
              country: address.country,
              email: address.email,
              phone: address.phone
            };
            return updateMyCart([
              {
                setShippingAddress: {
                  address: billingAddress,
                },
              },
            ],me.value.activeCart);
          }
        }
      }
    };
    const savedTokenCustomFieldsRetry = async (savedToken, payment) => {
      var updateResult;
      var tokenData;
      var securityCode;
      var isvSavedToken = null;
      var isvTokenAlias = null;
      let paymentData = {
        amountPlanned: {
          currencyCode: null,
          centAmount: null,
        },
        paymentMethodInfo: {
          name: null,
          paymentInterface: Constants.PAYMENT_INTERFACE,
          method: null,
        },
        custom: {},
      };
      let paymentCustomFields = {
        id: null,
        version: null,
        body: null,
      };
      paymentData.amountPlanned.currencyCode = payment.amount.currencyCode;
      paymentData.amountPlanned.centAmount = payment.amount.centAmount;
      if (customerSavedToken.length > Constants.NUMBER_ZERO) {
        customerSavedToken.forEach((token) => {
          tokenData = JSON.parse(token);
          if (tokenData.paymentToken == savedToken) {
            paymentData.custom = prepareFlexMicroformPaymentFields(token);
            isvSavedToken = tokenData.paymentToken;
            isvTokenAlias = tokenData.alias;
          }
        });
      }
      if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
        paymentData.paymentMethodInfo.method = Constants.CC_WITH_PAYER_AUTH;
        paymentData.paymentMethodInfo.name = {
          en: Constants.CC_WITH_PAYER_AUTH_EN,
        };
      } else {
        paymentData.paymentMethodInfo.method = Constants.CREDIT_CARD;
        paymentData.paymentMethodInfo.name = {
          en: Constants.CREDIT_CARD_EN,
        };
      }
      const paymentId = payment.id;
      const payemntVersion = payment.version;
      console.log(paymentId + '' + payemntVersion);
      securityCode = document.querySelector("#securityCode").value;
      paymentCustomFields.id = payment.id;
      paymentCustomFields.version = payment.version;
      paymentCustomFields.body = {
        isv_savedToken: isvSavedToken,
        isv_tokenAlias: isvTokenAlias,
        isv_deviceFingerprintId: deviceFingerprintId,
        isv_securityCode: Number(securityCode),
      };
      updateResult = await payments.updateSaveToken(paymentCustomFields);
      return updateResult;
    };

    const prepareVisaCheckoutPaymentFields = () => {
      var visaChktCallId;
      var paymentCustomFields;
      var multimidId = Constants.EMPTY_STRING;
      const browserInfo = retrieveBrowserInformation();
      if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
        multimidId = multimidIdentifier;
      }
      return new Promise((resolve, reject) => {
        visaChktCallId = PaymentMethods.visaCheckout.visaCallId;
        try {
          paymentCustomFields = {
            type: {
              key: Constants.PAYMENT_INTERFACE_TYPE,
            },
            fields: {
              isv_token: visaChktCallId,
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
              isv_userAgentHeader: navigator.userAgent,
              isv_customerIpAddress: customerIpAddress.value,
              isv_saleEnabled: saleFlagEnabled,
              isv_merchantId: multimidId,
              // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
              // isv_javaEnabled : browserInfo.isv_javaEnabled,
              // isv_browserLanguage : browserInfo.isv_browserLanguage,
              // isv_colorDepth : browserInfo.isv_colorDepth,
              // isv_screenHeight : browserInfo.isv_screenHeight,
              // isv_screenWidth : browserInfo.isv_screenWidth,
              // isv_timeDifference : browserInfo.isv_timeDifference
            },
          };
          resolve(paymentCustomFields);
        } catch (e) {
          reject(e);
        }
      });
    };

    const prepareGooglePayPaymentFields = () => {
      var paymentToken;
      var paymentCustomFields;
      var multimidId = Constants.EMPTY_STRING;
      // const browserInfo = await this.retrieveBrowserInformation();
      if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
        multimidId = multimidIdentifier;
      }
      return new Promise((resolve, reject) => {
        paymentToken = PaymentMethods.googlePay.paymentToken;
        try {
          paymentCustomFields = {
            type: {
              key: Constants.PAYMENT_INTERFACE_TYPE,
            },
            fields: {
              isv_token: paymentToken,
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
              isv_userAgentHeader: navigator.userAgent,
              isv_customerIpAddress: customerIpAddress.value,
              isv_saleEnabled: saleFlagEnabled,
              isv_merchantId: multimidId,
              // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
              // isv_javaEnabled : browserInfo.isv_javaEnabled,
              // isv_browserLanguage : browserInfo.isv_browserLanguage,
              // isv_colorDepth : browserInfo.isv_colorDepth,
              // isv_screenHeight : browserInfo.isv_screenHeight,
              // isv_screenWidth : browserInfo.isv_screenWidth,
              // isv_timeDifference : browserInfo.isv_timeDifference
            },
          };
          resolve(paymentCustomFields);
        } catch (e) {
          console.log("error",e)
          reject(e);
        }
      })
    };

    const prepareECheckCustomFields = () => {
      var paymentCustomFields;
      var multimidId = Constants.EMPTY_STRING;
      // const browserInfo = await  this.retrieveBrowserInformation();
      if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
        multimidId = multimidIdentifier;
      }
      var paymentInformation = {
        accountNumber: null,
        accountType: null,
        routingNumber: null,
      };
      return new Promise((resolve, reject) => {
        paymentInformation.accountNumber = document.querySelector("#accountNumber").value;
        paymentInformation.accountType = document.querySelector("#accountType").value
        paymentInformation.routingNumber = document.querySelector("#routingNumber").value;
        try {
          paymentCustomFields = {
            type: {
              key: Constants.PAYMENT_INTERFACE_TYPE,
            },
            fields: {
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
              isv_userAgentHeader: navigator.userAgent,
              isv_customerIpAddress: customerIpAddress.value,
              isv_accountNumber: paymentInformation.accountNumber,
              isv_accountType: paymentInformation.accountType,
              isv_routingNumber: paymentInformation.routingNumber,
              isv_merchantId: multimidId,
              // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
              // isv_javaEnabled : browserInfo.isv_javaEnabled,
              // isv_browserLanguage : browserInfo.isv_browserLanguage,
              // isv_colorDepth : browserInfo.isv_colorDepth,
              // isv_screenHeight : browserInfo.isv_screenHeight,
              // isv_screenWidth : browserInfo.isv_screenWidth,
              // isv_timeDifference : browserInfo.isv_timeDifference
            },
          };
          resolve(paymentCustomFields);
        } catch (e) {
          reject(e);
        }
      })
    }

    const prepareUnifiedCheckoutCardCustomFields = (tokens) => {
      var unifiedCheckoutData;
      var paymentCustomFields;
      var multimidId;
      // const browserInfo = await this.retrieveBrowserInformation();
      if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
        multimidId = multimidIdentifier;
      }
      if (null == tokens) {
        return new Promise((resolve, reject) => {
          unifiedCheckoutData = jwt_decode(PaymentMethods.unifiedCheckout.transientToken);
          try {
            paymentCustomFields = {
              type: {
                key: Constants.PAYMENT_INTERFACE_TYPE,
              },
              fields: {
                isv_transientToken: PaymentMethods.unifiedCheckout.transientToken,
                isv_maskedPan: unifiedCheckoutData.content.paymentInformation.card.number.bin + unifiedCheckoutData.content.paymentInformation.card.number.maskedValue,
                isv_cardType: unifiedCheckoutData.content.paymentInformation.card.type.value,
                isv_cardExpiryMonth: unifiedCheckoutData.content.paymentInformation.card.expirationMonth.value,
                isv_cardExpiryYear: unifiedCheckoutData.content.paymentInformation.card.expirationYear.value,
                isv_saleEnabled: saleFlagEnabled,
                isv_merchantId: multimidId,
                isv_deviceFingerprintId: deviceFingerprintId,
                // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
                // isv_javaEnabled : browserInfo.isv_javaEnabled,
                // isv_browserLanguage : browserInfo.isv_browserLanguage,
                // isv_colorDepth : browserInfo.isv_colorDepth,
                // isv_screenHeight : browserInfo.isv_screenHeight,
                // isv_screenWidth : browserInfo.isv_screenWidth,
                // isv_timeDifference : browserInfo.isv_timeDifference
              }
            }
            resolve(paymentCustomFields);
          } catch (e) {
            reject(e);
          }
        });
      } else {
        paymentCustomFields = {
          type: {
            key: Constants.PAYMENT_INTERFACE_TYPE,
          },
          fields: {
            isv_maskedPan: tokens.cardNumber,
            isv_cardType: tokens.cardType,
            isv_cardExpiryMonth: tokens.cardExpiryMonth,
            isv_cardExpiryYear: tokens.cardExpiryYear,
            isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
            isv_userAgentHeader: navigator.userAgent,
            isv_customerIpAddress: customerIpAddress.value,
            isv_saleEnabled: saleFlagEnabled,
            isv_merchantId: multimidId,
            isv_savedToken: tokens.paymentToken,
            isv_deviceFingerprintId: deviceFingerprintId,
            // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
            // isv_javaEnabled : browserInfo.isv_javaEnabled,
            // isv_browserLanguage : browserInfo.isv_browserLanguage,
            // isv_colorDepth : browserInfo.isv_colorDepth,
            // isv_screenHeight : browserInfo.isv_screenHeight,
            // isv_screenWidth : browserInfo.isv_screenWidth,
            // isv_timeDifference : browserInfo.isv_timeDifference
          },
        };
        return paymentCustomFields;
      }
    }

    const prepareGpayUnifiedCheckoutwithoutCardCustomFields = () => {
      var paymentCustomFields;
      var multimidId;
      // const browserInfo = await this.retrieveBrowserInformation();
      if (multiMid == Constants.STRING_TRUE && multimidIdentifier != Constants.EMPTY_STRING && multimidIdentifier != undefined) {
        multimidId = multimidIdentifier;
      }
      return new Promise((resolve, reject) => {
        try {
          paymentCustomFields = {
            type: {
              key: Constants.PAYMENT_INTERFACE_TYPE,
            },
            fields: {
              isv_transientToken: PaymentMethods.unifiedCheckout.transientToken,
              isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
              isv_userAgentHeader: navigator.userAgent,
              isv_customerIpAddress: customerIpAddress.value,
              isv_deviceFingerprintId: deviceFingerprintId,
              isv_saleEnabled: saleFlagEnabled,
              isv_merchantId: multimidId,
              // isv_javaScriptEnabled : browserInfo.isv_javaScriptEnabled,
              // isv_javaEnabled : browserInfo.isv_javaEnabled,
              // isv_browserLanguage : browserInfo.isv_browserLanguage,
              // isv_colorDepth : browserInfo.isv_colorDepth,
              // isv_screenHeight : browserInfo.isv_screenHeight,
              // isv_screenWidth : browserInfo.isv_screenWidth,
              // isv_timeDifference : browserInfo.isv_timeDifference
            }
          }
          resolve(paymentCustomFields);
        } catch (e) {
          reject(e);
        }
      });
    };

    const addAddress = async () => {
      var customerObject;
      var customerResponse;
      var updateObject = {
        version: null,
        address: null
      }
      var billingAddress;
      var cartObject = await cartApi.get(me.value.activeCart.id || me.value.activeCart.cartId);
      me.value.activeCart = {
        ...me.value.activeCart,
        version:cartObject.version
      }
      // me.value.activeCart.version = cartObject.version;
      console.log("line 2188",store.state.billingAddress)
      // const address = document.querySelector(".checkout-main-area").parentElement.__vue__.billingAddress;
      const address = store.state.billingAddress;
      console.log("addr",store.state.billingAddress.firstName,address.firstName)
      billingAddress = {
        firstName: address.firstName,
        lastName: address.lastName,
        streetName: address.streetName,
        additionalStreetInfo: address?.additionalStreetInfo || '',
        city: address.city,
        postalCode: address.postalCode,
        region: address.region,
        country: address.country,
        email: address.email,
        phone: address?.phone
      };
      loading.value = true;
      customerObject = await customer.getCustomer(loggedInCustomer.value);
      updateObject.address = billingAddress;
      updateObject.version = customerObject.version;
      customerResponse = await customer.updateAddress(updateObject);
      return customerResponse;
    };

    onMounted(async () => {
      window.mycontext = {
        getGooglePaymentsClient: getGooglePaymentsClient,
        getGoogleIsReadyToPayRequest: getGoogleIsReadyToPayRequest,
        getGoogleTransactionInfo: getGoogleTransactionInfo,
        getGooglePaymentDataRequest: getGooglePaymentDataRequest
      };

      // Fetch the customer's IP address
      customerIpAddress.value = await ipAddress.getIpAddress();
      if (Constants.STRING_TRUE === unifiedCheckoutFlag) {
        PaymentMethods.showing = 'unifiedCheckout';
        const event = {
          target: {
            value: Constants.UNIFIED_CHECKOUT
          }
        };
        await onPaymentMethodChange(event);
      } else {
        await renderPaymentMethod(PaymentMethods.showing);
      }
      window.addEventListener(
        Constants.EVENT_MESSAGE,
        (event) => {
          if (event.data.messageType === Constants.STRING_VALIDATION_CALLBACK) {
            transactionId = event.data.message;
            tid = event.data.message;
            isShow.value = false;
            loading.value = true;
            validationCallBackResolve();
          }

          if (event.origin === DeviceDataCollectionUrl) {
            console.log(event.data);
            ddcCallbackResolve();
          }
        },
        false
      );
    });
    return {
      isShow,
      showSavedCard,
      showCreditCard,
      isLoggedIn,
      error,
      loading,
      transactionId,
      selectOptions,
      unifiedCheckout,
      showUnifiedMethods,
      showUc,
      loggedInCustomer,
      me,
      PaymentMethods,
      showSavedCardforUc,
      visaButtonUrl,
      onPaymentMethodChange,
      ucSavedCardOption,
      makePaymentApplePay,
      placeOrder,
      savedCardOption,
      getGooglePaymentDataRequest,
      expiryYearOption
    }
  }
}

