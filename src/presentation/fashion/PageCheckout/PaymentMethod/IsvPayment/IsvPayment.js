/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
import jwt_decode from "jwt-decode";
import { onMounted, ref, reactive, emit, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import payments from "./api/payments";
import customer from "./api/customer";
import cartMixin from "../../../../../mixins/cartMixin";
import { Constants } from "./Constants";
import { base64encode } from "nodejs-base64";
import cartApi from "./api/cart";
import gpay from "./api/googlePay";
import ipAddress from "./api/ipAddress";
import {
  retrieveBrowserInformation,
  renderApplePay,
  preparePayPalPaymentFields,
} from "./utils/prepareFields";
import { renderGooglePay } from "./utils/appendPayments.js";
import {
  createPaymentAsync,
  handleFlexMicroform,
  handleVisaCheckout,
  handleGooglePay,
  handleApplePayPayment,
  handleECheckPayment,
  handleUnifiedCheckoutPayment,
  sharedState,
  handlePayPal,
} from "./utils/handlePayments";
import {
  appendUnifiedCheckoutJS,
  appendVisaCheckoutJS,
  renderFlex,
} from "./utils/appendPayments.js";
import { handleError } from "./utils/objectMapper.js";
import { useStore } from "vuex";
import useLocale from "hooks/useLocale";
import useCart from "hooks/useCart";
import { Buffer } from "buffer";
const deviceFingerprintId = uuidv4();
const VisaCheckoutApiKey = process.env.VUE_APP_VISA_CHECKOUT_API_KEY;
const PayerAuthenticationFlag = process.env.VUE_APP_USE_PAYER_AUTHENTICATION;
const saleFlag = process.env.VUE_APP_USE_SALE;
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;

const unifiedCheckoutFlag = process.env.VUE_APP_USE_UNIFIED_CHECKOUT || "false";
const multiMid = process.env.VUE_APP_USE_MULTI_MID;
const scaFlag = process.env.VUE_APP_USE_SCA;

let saleFlagEnabled = false;
let dfpUrl = Constants.EMPTY_STRING;

const environment =
  process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase();

if (Constants.ISV_PAYMENT_ENVIRONMENT_TEST === environment) {
  dfpUrl = `${Constants.DEVICE_FINGERPRINT_URL_TEST}${multimidIdentifier}${deviceFingerprintId}`;
} else if (Constants.ISV_PAYMENT_ENVIRONMENT_PRODUCTION === environment) {
  dfpUrl = `${Constants.DEVICE_FINGERPRINT_URL_LIVE}${multimidIdentifier}${deviceFingerprintId}`;
}

var VisaChktUrl;
var DeviceDataCollectionUrl;
// var ddcCallbackResolve;
var customerSavedToken;
var applePaySession;
var gpayPaymentsClient = null;
var count = Constants.NUMBER_ZERO;
var tid = null;
var paypalPaymentApproved = false;

if (
  Constants.ISV_PAYMENT_ENVIRONMENT_TEST ===
  process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase()
) {
  VisaChktUrl = Constants.TEST_VISA_CHECKOUT_URL;
  DeviceDataCollectionUrl = Constants.TEST_DEVICE_DATA_COLLECTION_URL;
}
if (
  Constants.ISV_PAYMENT_ENVIRONMENT_PRODUCTION ===
  process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase()
) {
  VisaChktUrl = Constants.PRODUCTION_VISA_CHECKOUT_URL;
  DeviceDataCollectionUrl = Constants.PRODUCTION_DEVICE_DATA_COLLECTION_URL;
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
  name: "ISVPayment",
  props: {
    amount: Object,
  },
  setup(props, { emit }) {
    let isShow = ref(false);
    let showSavedCard = ref(false);
    let showCreditCard = ref(true);
    let showSavedCardforUc = ref(false);
    let showUc = ref(true);
    let isLoggedIn = ref(false);
    let error = ref("");
    let loading = ref(false);
    let transactionId = ref(null);
    let selectOptions = ref([]);
    let unifiedCheckout = ref(unifiedCheckoutFlag);
    let showUnifiedMethods = ref(false);
    let loggedInCustomer = ref(null);
    let language = ref(null);
    let me = ref({ activeCart: {} });
    let amount = ref(null);
    let store = useStore();
    let customerIpAddress = ref("");
    let errorId = ref(null);
    let expiryYearOption = ref([]);
    let payPalButtonUrl = ref(""); //todo:paypal
    let visaButtonUrl = ref("");
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
    const { locale } = useLocale();
    const { cart } = useCart();
    const { updateMyCart } = cartMixin.setup();
    watch(
      language,
      async (newLanguage) => {
        me.value.activeCart = cart.value;
        const cartId = me.value.activeCart.cartId;
        const languageSelected = newLanguage;
        if (cartId && languageSelected) {
          try {
            const cartDetails = await cartApi.get(cartId);
            if (cartDetails.version > me.value.activeCart.version) {
              me.value.activeCart = cartDetails;
            }
            if (
              !cartDetails.locale ||
              cartDetails.locale !== languageSelected
            ) {
              await cartApi.getCart(me.value.activeCart.cartId);
              const result = await updateMyCart(
                {
                  setLocale: { locale: languageSelected },
                },
                me.value.activeCart
              );
              me.value.activeCart = result.data.updateMyCart;
            }
          } catch (error) {
            console.error("Error updating cart:", error);
          }
        }
      },
      { immediate: true }
    );

    const savedCardOption = async (divShow) => {
      error.value = null;
      var event = {
        target: {
          value: Constants.FLEX_MICROFORM,
        },
      };
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
      error.value = "";
      var event = {
        target: {
          value: Constants.UNIFIED_CHECKOUT,
        },
      };
      onPaymentMethodChange(event);
      if (Constants.UNIFIED_CHECKOUT === divShow) {
        showSavedCardforUc.value = false;
        showUc.value = true;
      } else {
        showSavedCardforUc.value = true;
        showUc.value = false;
      }
    };

    const onPaymentMethodChange = async (event) => {
      console.log('payment method chnge called')
      let customerData = null;
      error.value = "";
      selectOptions.value = [];
      count = Constants.NUMBER_ZERO;
      try {
        const getGoogleTransactionInfomation = await getGoogleTransactionInfo();
        window.mycontext = {
          //TODO:FIX - moved these func back here
          getGooglePaymentsClient: getGooglePaymentsClient,
          getGoogleIsReadyToPayRequest: getGoogleIsReadyToPayRequest,
          getGoogleTransactionInfo: getGoogleTransactionInfomation,
          getGooglePaymentDataRequest: getGooglePaymentDataRequest,
        };
        const authenticated = JSON.parse(localStorage.getItem("CUSTOMER"));
        if (authenticated) {
          isLoggedIn.value = true;
          loggedInCustomer.value = authenticated.customerId;

          customerData = await customer.getCustomer(authenticated.customerId);
          const customFields = customerData?.custom?.fields;
          if (customFields?.isv_tokens) {
            customerSavedToken = customFields.isv_tokens;
            if (Constants.NUMBER_ZERO < customerSavedToken.length) {
              selectOptions.value.push({
                value: Constants.STRING_CHOOSE,
                text: Constants.STRING_CHOOSE,
              });
              customerSavedToken.forEach((token) => {
                const tokenData = JSON.parse(token);
                selectOptions.value.push({
                  value: tokenData.paymentToken,
                  text: `${tokenData.alias} (${tokenData.cardName} ${tokenData.cardNumber} ${tokenData.cardExpiryMonth}/${tokenData.cardExpiryYear})`,
                });
              });
            } else {
              selectOptions.value.push({
                value: Constants.EMPTY_STRING,
                text: Constants.ERROR_MSG_NO_TOKENS,
              });
            }
          } else {
            selectOptions.value.push({
              value: Constants.EMPTY_STRING,
              text: Constants.ERROR_MSG_NO_TOKENS,
            });
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
      if (Constants.STRING_TRUE == saleFlag) {
        saleFlagEnabled = true;
      }
      if (locale) {
        language.value = locale.value;
      }
      switch (paymentMethod) {
        case Constants.FLEX_MICROFORM:
          PaymentMethods.flexMicroform.flexMicroFormObject = await renderFlex(
            props,
            expiryYearOption,
            PaymentMethods,
            PayerAuthenticationFlag,
            store,
            error,
            loading,
            me
          );
          break;
        case Constants.VISA_CHECKOUT: {
          if (
            Constants.ISV_PAYMENT_ENVIRONMENT_TEST ===
            process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase()
          ) {
            visaButtonUrl.value = Constants.TEST_VISA_BUTTON_URL;
          } else if (
            Constants.ISV_PAYMENT_ENVIRONMENT_PRODUCTION ===
            process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase()
          ) {
            visaButtonUrl.value = Constants.PRODUCTION_VISA_BUTTON_URL;
          }
          await appendVisaCheckoutJS(VisaChktUrl, PaymentMethods);
          let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
          onVisaCheckoutReady(cartDetails.totalPrice.currencyCode, cartDetails.totalPrice.centAmount);
        }
          break;
        case Constants.GOOGLE_PAY:
          await renderGooglePay(props, PaymentMethods);
          break;
        case Constants.APPLE_PAY:
          await renderApplePay(PaymentMethods, error);
          break;
        case Constants.UNIFIED_CHECKOUT:
          PaymentMethods.unifiedCheckout.jsLoaded = false;
          await renderUnifiedCheckoutWithFetch(
            me,
            showUnifiedMethods,
            error,
            PaymentMethods
          );
          break;
        case Constants.PAYPAL:
          console.log("URL", Constants.PAYPAL_CHECKOUT_URL);
          payPalButtonUrl.value = Constants.PAYPAL_CHECKOUT_URL;
          break;
      }
    };
    const onVisaCheckoutReady = (currencyCode, total) => {
      // V is defined through renderVisaChkt()
      // eslint-disable-next-line no-undef
      V.init({
        apikey: VisaCheckoutApiKey,
        paymentRequest: {
          currencyCode: currencyCode,
          subtotal: total,
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

    const renderUnifiedCheckoutWithFetch = async (
      me,
      showUnifiedMethods,
      error,
      PaymentMethods
    ) => {
      let captureContextResponse;
      let captureContext;
      let captureData;
      let clientLibraryUrl;
      let clientLibraryIntegrity;
      let transientToken;
      const showArgs = {
        containers: {
          paymentSelection: "#buttonPaymentListContainers",
          paymentScreen: "#embeddedPaymentContainer",
        },
      };
      try {
        console.log("me.value.activeCart", JSON.stringify(me.value.activeCart));
        captureContextResponse = await ipAddress.getCaptureContext(
          me.value.activeCart.cartId || me.value.activeCart.id,
          multimidIdentifier,
          null,
          null,
          null
        );
        if (Constants.EMPTY_STRING != captureContextResponse) {
          showUnifiedMethods.value = true;
          captureContext = captureContextResponse.captureContextData;
          try {
            captureData = jwt_decode(captureContext);
          } catch (decodeError) {
            console.error("JWT decode error:", decodeError);
            error.value = "JWT decode error";
            return;
          }
          clientLibraryUrl = captureContextResponse.clientLibrary;
          clientLibraryIntegrity =
            captureContextResponse.clientLibraryIntegrity;
          if (!clientLibraryUrl) {
            console.error(
              "Client library URL not found in capture data:",
              captureData
            );
            error.value = "Client library URL not found";
            return;
          }

          await appendUnifiedCheckoutJS(
            clientLibraryUrl,
            clientLibraryIntegrity,
            PaymentMethods
          );
          // eslint-disable-next-line no-undef
          Accept(captureContext)
            .then((accept) => accept.unifiedPayments(false))
            .then((up) => up.show(showArgs))
            .then((tt) => {
              transientToken = tt;
              PaymentMethods.unifiedCheckout.transientToken = tt;
              placeOrder();
            })
            .catch((e) => {
              console.error("Error during payment process:", e);
              error.value = e;
            });
        } else {
          showUnifiedMethods.value = false;
          error.value = Constants.ERROR_MSG_FORM_LOAD;
        }
      } catch (exception) {
        console.error("Exception occurred:", exception);
      }
    };

    const placeOrder = async () => {
      var lastPaymentState;
      var lastTransaction;
      var updatedCart;
      var applePayStatus;
      var failure;
      var paymentId = null;
      var serviceResponse = null;
      let paymentProcessingInfo = {
        paymentId: "",
        loading: "",
      };
      error.value = "";
      tid = null;
      const currentPayMethod = PaymentMethods.showing;
      switch (currentPayMethod) {
        case Constants.FLEX_MICROFORM: {
          paymentProcessingInfo = await handleFlexMicroform(
            store,
            count,
            loading,
            customerIpAddress?.value,
            PayerAuthenticationFlag,
            error,
            customerSavedToken,
            PaymentMethods,
            me,
            updateMyCart,
            deviceFingerprintId,
            isShow,
            transactionId,
            customer,
            loggedInCustomer
          );
          let tokenAlias = document.querySelector("#tokenAlias").value;
          console.log("paymentProcessingInfo", paymentProcessingInfo);
          if (
            paymentProcessingInfo?.updateResult?.custom?.fields &&
            Constants.ISV_PAYER_AUTHENTICATION_REQUIRED in
            paymentProcessingInfo?.updateResult?.custom?.fields
          ) {
            // let payerAuthenticationRequired =
            // paymentProcessingInfo.updateResult.custom.fields.isv_payerAuthenticationRequired;
            if (
              count == Constants.NUMBER_ZERO &&
              Constants.HTTP_CODE_TWO_HUNDRED_ONE ==
              paymentProcessingInfo?.updateResult?.custom?.fields
                ?.isv_payerEnrollHttpCode &&
              Constants.API_STATUS_CUSTOMER_AUTHENTICATION_REQUIRED ==
              paymentProcessingInfo?.updateResult?.custom?.fields
                ?.isv_payerEnrollStatus
            ) {
              count = count + Constants.NUMBER_ONE;
              if (tokenAlias == null || tokenAlias == "") {
                count = count + Constants.NUMBER_ONE;
                await placeOrder();
              } else if (
                (tokenAlias != null || tokenAlias != "") &&
                scaFlag == "false"
              ) {
                count = count + Constants.NUMBER_ONE;
                await placeOrder();
              }
            }
          }
          paymentId = paymentProcessingInfo.paymentId;
          loading.value = paymentProcessingInfo.loading;
          break;
        }
        case Constants.VISA_CHECKOUT: {
          loading.value = true;
          paymentProcessingInfo = await handleVisaCheckout(
            props,
            store,
            PaymentMethods,
            customerIpAddress.value,
            me
          );
          paymentId = paymentProcessingInfo.paymentId;
          loading.value = paymentProcessingInfo.loading;
          break;
        }
        case Constants.GOOGLE_PAY: {
          loading.value = true;
          paymentProcessingInfo = await handleGooglePay(
            //TODO:fix changed variable name here
            props,
            store,
            PaymentMethods,
            customerIpAddress,
            loading,
            me
          );
          console.log(
            "payment id isvpayments",
            paymentProcessingInfo.paymentId
          );
          paymentId = paymentProcessingInfo.paymentId;
          loading.value = paymentProcessingInfo.loading;
          break;
        }
        case Constants.APPLE_PAY: {
          loading.value = true;
          paymentId = await handleApplePayPayment(
            store,
            PaymentMethods,
            applePaySession,
            loading,
            error
          );
          paymentId = paymentProcessingInfo.paymentId;
          loading.value = paymentProcessingInfo.loading;
          break;
        }
        case Constants.ECHECK: {
          loading.value = true;
          paymentProcessingInfo = await handleECheckPayment(
            props,
            store,
            loading,
            error,
            customerIpAddress,
            me
          );
          paymentId = paymentProcessingInfo.paymentId;
          loading.value = paymentProcessingInfo.loading;
          console.log("paymentId in flexmicro-->", paymentId);
          break;
        }
        case Constants.UNIFIED_CHECKOUT: {
          loading.value = true;
          paymentProcessingInfo = await handleUnifiedCheckoutPayment(
            store,
            props,
            PaymentMethods,
            loading,
            PayerAuthenticationFlag,
            error,
            customerIpAddress,
            deviceFingerprintId,
            count,
            customerSavedToken,
            updateMyCart,
            transactionId,
            me,
            isShow
          );
          let tokenAlias = document.querySelector("#ucTokenAlias").value;
          console.log("paymentProcessingInfo", paymentProcessingInfo);
          if (
            paymentProcessingInfo?.payerAuthenticationRequired &&
            count == Constants.NUMBER_ZERO &&
            Constants.HTTP_CODE_TWO_HUNDRED_ONE ==
            paymentProcessingInfo?.updateResult?.custom?.fields
              ?.isv_payerEnrollHttpCode &&
            Constants.API_STATUS_CUSTOMER_AUTHENTICATION_REQUIRED ==
            paymentProcessingInfo?.updateResult?.custom.fields
              .isv_payerEnrollStatus
          ) {
            if (tokenAlias == null || tokenAlias == "") {
              count = count + Constants.NUMBER_ONE;
              await placeOrder();
            } else if (
              (tokenAlias != null || tokenAlias != "") &&
              scaFlag == "false"
            ) {
              count = count + Constants.NUMBER_ONE;
              await placeOrder();
            }
          }
          paymentId = paymentProcessingInfo.paymentId;
          loading.value = paymentProcessingInfo.loading;
          break;
        }
        case Constants.PAYPAL: {
          console.log("under paypal Case");
          paymentProcessingInfo = await handlePayPal(
            store,
            error,
            me,
            updateMyCart
          );
          paymentId = paymentProcessingInfo.paymentId;
          loading.value = paymentProcessingInfo.loading;
          break;
        }
        default:
          throw new Error(
            currentPayMethod + Constants.ERROR_MSG_NOT_RECOGNIZED
          );
      }
      emit("card-paid", paymentId, {
        onValidationError: () => {
          loading.value = false;
        },
        beforeCompleteAsync: async (result) => {
          loading.value = true;
          lastPaymentState = await payments.get(paymentId);
          if (saleFlagEnabled || Constants.ECHECK === currentPayMethod) {
            serviceResponse =
              await payments.addSaleTransaction(lastPaymentState);
          } else {
            serviceResponse = await payments.addTransaction(lastPaymentState);
          }
          if (serviceResponse.errors) {
            handleError(serviceResponse.statusCode, loading, error);
            throw new Error(error);
          }
          failure = false;
          serviceResponse.transactions.forEach((transaction) => {
            if (
              Constants.FAILURE === transaction.state ||
              Constants.INITIAL === transaction.state
            ) {
              failure = true;
              lastTransaction = transaction;
              return;
            }
          });
          if (failure) {
            loading.value = false;
            error.value = Constants.ERROR_MSG_SUNRISE;
            if (lastTransaction) {
              errorId.value = `${serviceResponse.id}`;
            }
            if (Constants.APPLE_PAY === PaymentMethods.showing) {
              // eslint-disable-next-line no-undef
              applePayStatus = ApplePaySession.STATUS_FAILURE;
              applePaySession.completePayment(applePayStatus);
            }
            throw new Error(error.value);
          }
          if (Constants.APPLE_PAY === PaymentMethods.showing) {
            // eslint-disable-next-line no-undef
            applePayStatus = ApplePaySession.STATUS_SUCCESS;
            applePaySession.completePayment(applePayStatus);
          }
          console.log("Result", JSON.stringify(result));
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
      });
    };

    const getGooglePaymentDataRequest = async () => {
      const paymentDataRequest = Object.assign({}, baseRequest);
      paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
      paymentDataRequest.transactionInfo = await getGoogleTransactionInfo();
      paymentDataRequest.merchantInfo = {
        merchantName: process.env.VUE_APP_USE_GPAY_MERCHANT_ID,
        merchantId: process.env.VUE_APP_USE_GPAY_MERCHANT_ID,
      };
      paymentDataRequest.callbackIntents =
        Constants.GOOGLE_PAY_CALLBACK_INTENTS;
      return paymentDataRequest;
    };

    const getGoogleIsReadyToPayRequest = () => {
      return Object.assign({}, baseRequest, {
        allowedPaymentMethods: [baseCardPaymentMethod],
      });
    };

    const getGoogleTransactionInfo = async () => {
      let results = await cartApi.getCart(
        me.value.activeCart.id || me.value.activeCart.cartId
      );
      console.log("results", results);

      var totalprice =
        (
          results.totalPrice.centAmount /
          Math.pow(10, results.totalPrice.fractionDigits)
        ).toFixed(results.totalPrice.fractionDigits) * 1;
      return {
        // countryCode: store.state.country,
        countryCode: "US",
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
          environment:
            process.env.VUE_APP_USE_ISV_PAYMENT_RUN_ENVIRONMENT.toUpperCase(),
          merchantInfo: {
            merchantName: process.env.VUE_APP_USE_GPAY_MERCHANT_NAME,
            merchantId: process.env.VUE_APP_USE_GPAY_MERCHANT_ID,
          },
          paymentDataCallbacks: {
            onPaymentAuthorized: onPaymentAuthorized,
          },
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
        PaymentMethods.googlePay.paymentToken = Buffer.from(
          paymentToken,
          "utf8"
        ).toString("base64");
        try {
          if (PaymentMethods.googlePay.paymentToken) {
            placeOrder();
          } else {
            error.value = Constants.ERROR_MSG_SUNRISE;
          }
        } catch (e) {
          console.log("error", e);
          error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
        }
        resolve({});
      });
    };

    const handlePayPalSession = async () => {
      let cartDetails = me.value.activeCart;
      var oldPayment;
      var payment;
      let paymentData = {
        amountPlanned: {
          currencyCode: cartDetails.totalPrice.currencyCode,
          centAmount: cartDetails.totalPrice.centAmount,
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
      let paymentCustomFields = {
        id: null,
        version: null,
        body: null,
      };
      loading.value = true;
      error.value = "";
      if (!store.state.validBillingForm) {
        error.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
        loading.value = false;
        return;
      }
      paymentData.paymentMethodInfo.method = Constants.PAYPAL;
      paymentData.paymentMethodInfo.name = {
        en: Constants.PAYPAL_EN,
      };
      oldPayment = store.state.payment;
      oldPayment?.id && payments.delete(oldPayment);
      //todo:change to update call
      payment = await createPaymentAsync(paymentData);
      // paypal_Buttons.close(); //todo:paypal : add css to avoid clicking again
      console.log("Payment create response", JSON.stringify(payment));
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
      } else {
        // return payment.custom.fields.isv_paypal_orderId;
        console.log("Response from create call", payment.custom.fields);
        paymentCustomFields.id = payment.id;
        paymentCustomFields.version = payment.version;
        paymentCustomFields.body = await preparePayPalPaymentFields(
          customerIpAddress.value
        );
        console.log("Paypal custom fields", paymentCustomFields);
        let updateResult =
          await payments.updatePayPalCustomFields(paymentCustomFields);
        // paymentId = updateResult.id;
        console.log("Update result", JSON.stringify(updateResult));
        if (updateResult.custom.fields.isv_payPalUrl) {
          openCenteredPopup(
            updateResult.custom.fields.isv_payPalUrl,
            "paypal-popup",
            500,
            600
          );
        } else {
          loading.value = false;
          error.value = Constants.ERROR_MSG_SUNRISE;
        }
        // paypal_Buttons.close()
      }
    };

    function openCenteredPopup(url, windowName, width, height) {
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      const windowFeatures = `
          width=${width},
          height=${height},
          left=${left},
          top=${top},
          scrollbars=yes,
          resizable=yes
        `;
      const popupWindow = window.open(url, windowName, windowFeatures);
      if (!popupWindow) {
        alert("Popup blocked! Please allow popups in your browser settings.");
        loading.value = false;
        error.value = Constants.ERROR_MSG_SUNRISE;
        clearInterval(popupCheckInterval);
      }

      const checkPopupClosed = () => {
        // If the popup is closed or not available
        if (popupWindow.closed && !paypalPaymentApproved) {
          loading.value = false;
          error.value = Constants.ERROR_MSG_SUNRISE;
          clearInterval(popupCheckInterval);
        }
      };

      // Set an interval to check every 500ms if the pop-up window is closed
      const popupCheckInterval = setInterval(checkPopupClosed, 500);

      return popupWindow;
    }

    async function validateApplePay(validationUrl, callback) {
      var oldPayment;
      var payment;
      var paymentCustomFields;
      var multimidId = Constants.EMPTY_STRING;
      let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
      let paymentData = {
        amountPlanned: {
          currencyCode: cartDetails.totalPrice.currencyCode,
          centAmount: cartDetails.totalPrice.centAmount,
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
      if (
        Constants.STRING_TRUE === multiMid &&
        Constants.EMPTY_STRING === multimidIdentifier &&
        undefined === multimidIdentifier
      ) {
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
        isv_merchantId: multimidId,
      };
      paymentData.custom.fields = paymentCustomFields;
      oldPayment = store.state.payment;
      oldPayment?.id && payments.delete(oldPayment);
      payment = await createPaymentAsync(paymentData);
      if (
        payment &&
        payment?.custom &&
        Constants.ISV_PAYMENT_APPLE_PAY_SESSION_DATA in payment.custom.fields
      ) {
        store.dispatch(Constants.STRING_SET_PAYMENT, payment);
        callback(payment.custom.fields.isv_applePaySessionData);
      }
    }

    const makePaymentApplePay = async () => {
      var paymentRequest;
      var session;
      var totalPrice = Constants.FLOAT_ZERO;
      let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
      totalPrice =
        (cartDetails.totalPrice.centAmount / Constants.NUMBER_HUNDRED).toFixed(
          Constants.NUMBER_TWO
        ) * Constants.NUMBER_ONE;
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
      session.onpaymentauthorized = function (event) {
        var paymentDataString;
        var paymentDataBase64;
        paymentDataString = JSON.stringify(event.payment.token.paymentData);
        paymentDataBase64 = base64encode(paymentDataString);
        PaymentMethods.applePay.applePayData = paymentDataBase64;
        placeOrder();
      };

      session.oncancel = function (event) {
        error.value = Constants.ERROR_MSG_APPLE_PAY_SESSION;
      };
    };

    window.addEventListener(
      Constants.EVENT_MESSAGE,
      async (event) => {
        if (Constants.STRING_VALIDATION_CALLBACK === event.data.messageType) {
          transactionId.value = event.data.message;
          tid = event.data.message;
          isShow.value = false;
          loading.value = true;
          if (sharedState.validationCallBackResolve) {
            sharedState.validationCallBackResolve();
          }
        }
        if (event.origin === DeviceDataCollectionUrl) {
          console.log(event.data);
          sharedState.ddcCallbackResolve();
        }
        if (
          event.data.messageType ===
          "paypalCallBack" /*&& event.data.message === 'SUCCESS'*/
        ) {
          if (event.data.message === "Completed") {
            loading.value = true;
            paypalPaymentApproved = true;
            await placeOrder();
          } else if (event.data.message === "Cancelled") {
            loading.value = false;
            error.value = true;
            error.value = Constants.ERROR_MSG_SUNRISE;
          }
        }
      },
      false
    );

    onMounted(async () => {
      const getGoogleTransactionInfomation = await getGoogleTransactionInfo();
      console.log("on mounted", getGoogleTransactionInfomation);
      window.mycontext = {
        //TODO:FIX - moved these func back here
        getGooglePaymentsClient: getGooglePaymentsClient,
        getGoogleIsReadyToPayRequest: getGoogleIsReadyToPayRequest,
        getGoogleTransactionInfo: getGoogleTransactionInfomation,
        getGooglePaymentDataRequest: getGooglePaymentDataRequest,
      };
      customerIpAddress.value = await ipAddress.getIpAddress();
      if (Constants.STRING_TRUE === unifiedCheckoutFlag) {
        PaymentMethods.showing = "unifiedCheckout";
        const event = {
          target: {
            value: Constants.UNIFIED_CHECKOUT,
          },
        };
        await onPaymentMethodChange(event);
      } else {
        await renderPaymentMethod(PaymentMethods.showing);
      }
    });

    return {
      isShow,
      showSavedCardforUc,
      showUc,
      showSavedCard,
      showCreditCard,
      isLoggedIn,
      error,
      loading,
      selectOptions,
      unifiedCheckout,
      showUnifiedMethods,
      loggedInCustomer,
      me,
      PaymentMethods,
      visaButtonUrl,
      handlePayPalSession,
      onPaymentMethodChange,
      ucSavedCardOption,
      makePaymentApplePay,
      placeOrder,
      savedCardOption,
      expiryYearOption,
      payPalButtonUrl,
    };
  },
};
