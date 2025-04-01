import { Constants } from "../Constants";
import payments from "../api/payments";
import flexStyle from "../FlexMicroformStyle";
import gpay from "../api/googlePay";
import { createPaymentAsync } from "./handlePayments";
import cartApi from "../api/cart"
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;
const multiMid = process.env.VUE_APP_USE_MULTI_MID;


export const appendUnifiedCheckoutJS = async (
  clientLibraryUrl,
  clientLibraryIntegrity,
  PaymentMethods
) => {
  var unifiedCheckoutScript;
  if (!PaymentMethods.unifiedCheckout.jsLoaded) {
    PaymentMethods.unifiedCheckout.jsLoaded = new Promise(function (
      resolve,
      reject
    ) {
      unifiedCheckoutScript = document.createElement(Constants.STRING_SCRIPT);
      unifiedCheckoutScript.setAttribute(Constants.STRING_SRC, clientLibraryUrl);
      unifiedCheckoutScript.setAttribute(Constants.STRING_INTEGRITY, clientLibraryIntegrity);
      unifiedCheckoutScript.setAttribute(Constants.STRING_CROSS_ORIGIN, Constants.STRING_ANONYMOUS);
      unifiedCheckoutScript.onload = function () {
        resolve(true);
      };
      unifiedCheckoutScript.onerror = function (event) {
        reject(event);
      };
      document.head.appendChild(unifiedCheckoutScript);
    });
  }
  return PaymentMethods.unifiedCheckout.jsLoaded;
};

export const appendFlexJS = async (PaymentMethods, customFields) => {
  var flexScript;
  if (!PaymentMethods.flexMicroform.jsLoaded) {
    PaymentMethods.flexMicroform.jsLoaded = new Promise(function (resolve, reject) {
      flexScript = document.createElement(Constants.STRING_SCRIPT);
      flexScript.setAttribute(Constants.STRING_SRC, customFields?.isv_clientLibrary);
      flexScript.setAttribute(Constants.STRING_INTEGRITY, customFields?.isv_clientLibraryIntegrity);
      flexScript.setAttribute(Constants.STRING_CROSS_ORIGIN, Constants.STRING_ANONYMOUS);
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

export const appendGooglePayJS = async (PaymentMethods) => {
  var googlepayScript;
  if (!PaymentMethods.googlePay.jsLoaded) {
    PaymentMethods.googlePay.jsLoaded = new Promise(function (resolve, reject) {
      googlepayScript = document.createElement(Constants.STRING_SCRIPT);
      googlepayScript.setAttribute(
        Constants.STRING_SRC,
        Constants.GOOGLE_PAY_URL
      );
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

export const appendVisaCheckoutJS = async (VisaChktUrl, PaymentMethods) => {
  var visaChktScript;
  if (!PaymentMethods.visaCheckout.jsLoaded) {
    PaymentMethods.visaCheckout.jsLoaded = new Promise(function (
      resolve,
      reject
    ) {
      visaChktScript = document.createElement(Constants.STRING_SCRIPT);
      visaChktScript.setAttribute(Constants.STRING_SRC, VisaChktUrl);
      visaChktScript.onload = function () {
        console.log("Visa Checkout Script Loaded")
        resolve(true);
      };
      visaChktScript.onerror = function (event) {
        console.log("Visa Checkout - Error Loading Script")
        reject(event);
      };
      document.head.appendChild(visaChktScript);
    });
  }
  return PaymentMethods.visaCheckout.jsLoaded;
};


export const renderFlex = async (
  props,
  expiryYearOption,
  PaymentMethods,
  PayerAuthenticationFlag,
  store,
  error,
  loading,
  me
) => {
  var oldPayment;
  var payment;
  var captureContext;
  var flexInstance;
  var flexMicroform;
  var multimidId = "";
  let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
  console.log(cartDetails.totalPrice.currencyCode + "" + cartDetails.totalPrice.centAmount)
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
  if (Constants.STRING_TRUE === multiMid && multimidIdentifier) {
    multimidId = multimidIdentifier;
  }
  paymentData.custom.fields.isv_merchantId = multimidId;
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
  if (
    Constants.ISV_TOKEN_CAPTURE_CONTEXT in payment.custom.fields &&
    Constants.EMPTY_STRING !=
    payment.custom.fields.isv_tokenCaptureContextSignature
  ) {
    captureContext = payment.custom.fields.isv_tokenCaptureContextSignature;
    await appendFlexJS(PaymentMethods, payment.custom.fields);
    // Flex comes from flex JS on appendFlexJS()
    // eslint-disable-next-line
    flexInstance = new Flex(captureContext);
    flexMicroform = flexInstance.microform("card", { styles: flexStyle });
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
    PaymentMethods.flexMicroform.flexMicroFormObject = flexMicroform;
  } else {
    loading.value = false;
    error.value = Constants.ERROR_MSG_FORM_LOAD;
    return;
  }
  return flexMicroform;
};

export const renderGooglePay = async (props, paymentMethods) => {
  await appendGooglePayJS(paymentMethods);
  gpay.onGooglePayLoaded(props.amount.currencyCode);
};

export const renderApplePay = (PaymentMethods, error) => {
  error.value = "";
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
