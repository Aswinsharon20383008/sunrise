import payments from "../api/payments";
import { Constants } from "../Constants";
import {
  prepareFlexMicroformPaymentFields,
  savedTokenCustomFieldsRetry,
  updateBrowserInfo,
  prepareVisaCheckoutPaymentFields,
  prepareGooglePayPaymentFields,
  prepareECheckCustomFields,
  setCartBillingAddressMultiple,
  setCartShippingAddress,
  setCartBillingAddress,
  // prepareCustomFields,
  prepareUnifiedCheckoutCardCustomFields,
  prepareGpayUnifiedCheckoutwithoutCardCustomFields,
  addAddress
} from "./prepareFields";
import { handleError } from "./errorHandler";
import jwt_decode from "jwt-decode";
import cartApi from "../api/cart";
export const sharedState = {
  validationCallBackResolve: null,
  ddcCallbackResolve: null,
};

export const createPaymentAsync = async function (paymentDto) {
  return await payments.create(paymentDto);
};

export async function handleFlexMicroform(
  store,
  count,
  loading,
  customerIpAddress,
  PayerAuthenticationFlag,
  error,
  customerSavedToken,
  paymentMethodsObject,
  me,
  updateMyCart,
  deviceFingerprintId,
  isShow,
  transactionId,
  customer,
  loggedInCustomer
) {
  let paymentProcessingInfo = {
    loading: true,
    paymentId: "",
    count: 0,
    updateResult: {}
  };
  let paymentCustomFields;
  let paymentId = "";
  let lastPayment;
  let updateResult;
  try {
    let savedToken = document.querySelector("#savedToken").value;
    loading.value = true;
    if (savedToken && Constants.STRING_CHOOSE !== savedToken) {
      lastPayment = await payments.get(store.state.payment.id);
      if (0 < count) {
        updateResult = await savedTokenCustomFieldsRetry(
          savedToken,
          lastPayment,
          customerSavedToken,
          me
        );
      } else {
        console.log("line 59", savedToken, lastPayment);
        updateResult = await savedTokenFunc(savedToken, lastPayment, store, customerSavedToken, PayerAuthenticationFlag, deviceFingerprintId, error);
        paymentId = updateResult?.id;
      }
      console.loh("update res line 65", JSON.stringify(updateResult))
      if (updateResult?.errors) {
        handleError(updateResult.statusCode, loading, error);
        return;
      }
    } else {
      lastPayment = await payments.get(store.state.payment.id);
      paymentCustomFields = {
        id: lastPayment.id,
        version: lastPayment.version,
        body: await prepareFlexMicroformPaymentFields(
          null,
          count,
          customerIpAddress,
          paymentMethodsObject
        ),
      };
      if (validateExpiryDate(paymentCustomFields.body)) {
        handleError(Constants.ERROR_MSG_INVALID_EXPIRY_DATE, loading, error);
        return;
      }
      let tokenAlias = document.querySelector("#tokenAlias")?.value;
      if (tokenAlias) {
        console.log("Inside if", tokenAlias)
        paymentCustomFields.body.tokenAlias = tokenAlias;
        await addAddress(me, loading, store, customer, loggedInCustomer);
        updateResult = await payments.updateWithTokenAlias(
          paymentCustomFields
        );
      }
      else {
        updateResult = await payments.update(paymentCustomFields);
      }
      paymentId = updateResult?.id;
      console.log("update res", updateResult)
      if (updateResult.errors) {
        const { loading } = handleError(updateResult.statusCode);
        console.log("Loading", loading)
        paymentProcessingInfo.loading = loading;

        return;
      }
    }
    if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
      if (!(await handleBillingAndShipping(store, me, updateMyCart, loading, PayerAuthenticationFlag)))
        return;
      console.log("line 110", transactionId.value)
      let handlePayerAuth = await handlePayerAuthentication(updateResult, loading, isShow, count);
      // if (!(await handlePayerAuthentication(updateResult,loading,isShow,count))) return;
      if (!handlePayerAuth) {
        paymentProcessingInfo.paymentId = updateResult.id;
        return paymentProcessingInfo
      }
      else {
        updateResult = handlePayerAuth.updateResult;
        paymentProcessingInfo.count = handlePayerAuth.count;
        if (
          Constants.ISV_PAYER_AUTHENTICATION_TRANSACTION_ID in
          updateResult.custom.fields && transactionId.value
        ) {
          paymentCustomFields.id = updateResult.id;
          paymentCustomFields.version = updateResult.version;
          paymentCustomFields.body = transactionId.value;
          paymentProcessingInfo.updateResult = await payments.updateTransactionId(
            paymentCustomFields
          );
          console.log("Line 124 updateresult", updateResult);
          paymentId = updateResult.id
        }
      }
    }
  } catch (e) {
    console.log(e);
    handleError(Constants.ERROR_MSG_PAYMENT_PROCESS, loading, error);
  }
  console.log("Payment id", paymentId)
  paymentProcessingInfo.paymentId = paymentId;
  return paymentProcessingInfo;
}

export async function handlePayPal(store, error, me, updateMyCart) {
  let setBillingResult = null;
  let setShippingResult = null;
  let lastPayment = null;
  let paymentId = null;
  let paymentProcessingInfo = {
    paymentId: "",
    loading: true,
  };
  try {
    console.log("me object--->", JSON.stringify(me));
    setBillingResult = await setCartBillingAddress(store, me, updateMyCart);
    console.log(setBillingResult);
    setShippingResult = await setCartShippingAddress(store, me, updateMyCart);
    console.log(setShippingResult);
    if (null == setBillingResult && null == setShippingResult) {
      paymentProcessingInfo.loading = false;
      error.value = Constants.ERROR_MSG_FILL_REQUIRED_DATA;
      return;
    } else {
      paymentProcessingInfo.loading = true;
    }
    console.log("payment id", store.state);
    lastPayment = await payments.get(store.state.payment.id);
    paymentId = lastPayment?.id;
    // );
  } catch (e) {
    console.log("under the catch statement");
    console.log(e);
    paymentProcessingInfo.loading = false;
    error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
    return;
  }
  paymentProcessingInfo.paymentId = paymentId;
  return paymentProcessingInfo;
}

export async function handleVisaCheckout(props, store, PaymentMethods, customerIpAddress, me) {
  let paymentProcessingInfo = {
    paymentId: "",
    loading: true,
  };
  let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
  let paymentData = {
    amountPlanned: {
      currencyCode: cartDetails.totalPrice.currencyCode,
      centAmount: cartDetails.totalPrice.centAmount,
    },
    paymentMethodInfo: {
      paymentInterface: Constants.PAYMENT_INTERFACE,
      method: Constants.VISA_CHECKOUT,
      name: { en: Constants.VISA_CHECKOUT_EN },
    },
  };
  let oldPayment;
  let payment;
  try {
    console.log('paymentData', JSON.stringify(paymentData))
    let visaCheckoutCustomFields = await prepareVisaCheckoutPaymentFields(PaymentMethods, customerIpAddress);
    paymentData.custom = visaCheckoutCustomFields;
    console.log('paymentData', JSON.stringify(paymentData))
  } catch (e) {
    console.log("error", e);
    handleError(Constants.ERROR_MSG_PAYMENT_PROCESS);
    return;
  }
  oldPayment = store.state.payment;
  if (oldPayment?.id) {
    await payments.delete(oldPayment);
  }
  payment = await createPaymentAsync(paymentData);
  store.dispatch(Constants.STRING_SET_PAYMENT, payment);

  if (payment.errors) {
    handleError(payment.statusCode);
    return;
  }
  paymentProcessingInfo.paymentId = payment.id;
  return paymentProcessingInfo;
}

export async function handleGooglePay(
  props,
  store,
  paymentMethodsObject,
  customerIpAddress,
  loading,
  me//TODO:fix added loading here
) {
  let paymentProcessingInfo = {
    paymentId: "",
    loading: true,
  };
  let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
  let paymentData = {
    amountPlanned: {
      currencyCode: cartDetails.totalPrice.currencyCode,
      centAmount: cartDetails.totalPrice.centAmount,
    },
    paymentMethodInfo: {
      paymentInterface: Constants.PAYMENT_INTERFACE,
      method: Constants.GOOGLE_PAY,
      name: { en: Constants.GOOGLE_PAY_EN },
    },
  };
  try {
    let googlePayCustomFields = await prepareGooglePayPaymentFields(
      paymentMethodsObject,
      customerIpAddress
    );
    paymentData.custom = googlePayCustomFields;
  } catch (e) {
    console.log(e);
    loading.value = false;//TODO:fix added loading
    handleError(Constants.ERROR_MSG_PAYMENT_PROCESS);
    return;
  }
  let oldPayment = store.state.payment;
  if (oldPayment?.id) {
    await payments.delete(oldPayment);
  }
  let payment = await createPaymentAsync(paymentData);
  if (Constants.HTTP_CODE_FOUR_HUNDRED != payment.statusCode) {
    store.dispatch(Constants.STRING_SET_PAYMENT, payment);
  }
  if (payment.errors) {
    loading.value = false;//TODO:fix added loading
    handleError(payment.statusCode);
    return;
  }
  paymentProcessingInfo.paymentId = payment.id;
  paymentProcessingInfo.loading = loading;//TODO:fix returning loading
  return paymentProcessingInfo;
}

export async function handleApplePayPayment(
  store,
  PaymentMethods,
  applePaySession,
  loading,
  error,
) {
  let errorFlag = false;
  let paymentId;
  let paymentProcessingInfo = {
    paymentId: "",
    loading: true,
  };
  try {
    if (PaymentMethods.applePay.applePayData) {
      const lastPayment = await payments.get(store.state.payment.id);
      const paymentCustomFields = {
        id: lastPayment.id,
        version: lastPayment.version,
        body: PaymentMethods.applePay.applePayData,
        sale: process.env.VUE_APP_USE_SALE,
      };
      const updateResult = await payments.updateApplePayToken(
        paymentCustomFields
      );
      paymentId = updateResult.id;
      if (updateResult.errors) {
        errorFlag = true;
      }
    } else {
      errorFlag = true;
    }
  } catch (e) {
    console.log("error", e);
    errorFlag = true;
    paymentProcessingInfo.loading = false;
  }
  if (errorFlag) {
    handleError(Constants, applePaySession, loading, error);
    return;
  }
  paymentProcessingInfo.paymentId = paymentId;
  return paymentProcessingInfo;
}

export async function handleECheckPayment(
  props,
  store,
  loading,
  error,
  customerIpAddress,
  me
) {
  let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
  const paymentData = {
    amountPlanned: {
      currencyCode: cartDetails.totalPrice.currencyCode,
      centAmount: cartDetails.totalPrice.centAmount,
    },
    paymentMethodInfo: {
      paymentInterface: Constants.PAYMENT_INTERFACE,
      method: Constants.ECHECK,
      name: { en: Constants.ECHECK },
    },
  };
  console.log('paymentData befor', JSON.stringify(paymentData, null, 2))
  let paymentProcessingInfo = {
    loading: false,
    paymentId: "",
  };
  try {
    paymentProcessingInfo.loading = true;
    const eCheckCustomFields = await prepareECheckCustomFields(
      customerIpAddress
    );
    paymentData.custom = eCheckCustomFields;
  } catch (e) {
    paymentProcessingInfo.loading = false;
    error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
    return;
  }
  const oldPayment = store.state.payment;
  if (oldPayment?.id) {
    await payments.delete(oldPayment);
  }
  console.log("customField--->", JSON.stringify(paymentData));
  const payment = await createPaymentAsync(paymentData);
  console.log("create payment for echeck", JSON.stringify(payment));
  store.dispatch(Constants.STRING_SET_PAYMENT, payment);
  const paymentId = payment.id;
  if (payment.errors) {
    handleError(Constants, payment, loading, error);
    return;
  }
  paymentProcessingInfo.paymentId = paymentId;
  return paymentProcessingInfo;
}

export async function handleUnifiedCheckoutPayment(
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
) {
  let paymentProcessingInfo = {
    loading: true,
    paymentId: "",
    count: 0,
    updateResult: {},
    payerAuthenticationRequired: false

  };
  let paymentId,
    paymentData = {},
    paymentCustomFields = {},
    // payerAuthenticationRequired = false,
    tokenData,
    lastPayment,
    securityCode;
  try {
    const savedToken = document.querySelector("#ucSavedToken").value;
    let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
    if (
      Constants.EMPTY_STRING != savedToken &&
      Constants.STRING_CHOOSE != savedToken
    ) {
      paymentData.amountPlanned = cartDetails.totalPrice.centamount;
      paymentData.paymentMethodInfo = handlePaymentMethodCC(
        PayerAuthenticationFlag
      );

      if (customerSavedToken.length > Constants.NUMBER_ZERO) {
        (securityCode =
          document.querySelector("#ucSecurityCode").value),
          await customerSavedToken.forEach(async (token) => {
            tokenData = JSON.parse(token);
            if (tokenData.paymentToken == savedToken) {
              paymentData.custom =
                await prepareUnifiedCheckoutCardCustomFields(tokenData);
              console.log("paymentdata custom", paymentData);
            }
          });
      }


      paymentData.custom = prepareUnifiedCheckoutCardCustomFields(
        tokenData,
        customerIpAddress,
        PaymentMethods
      );
      if (securityCode) {
        paymentData.custom.fields.isv_securityCode =
          Number(securityCode);
      }
    } else {
      const transientToken = PaymentMethods.unifiedCheckout.transientToken;
      paymentData = await handleTransientToken(
        transientToken,
        props,
        Constants,
        PaymentMethods,
        customerIpAddress,
        PayerAuthenticationFlag,
        me
      );
      let tokenAlias = document.querySelector("#ucTokenAlias").value;
      if (tokenAlias) {
        paymentData.custom.fields.isv_tokenAlias = tokenAlias;
      }
    }
  } catch (e) {
    console.log("error", e);
    paymentProcessingInfo.loading = false;
    error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
    return;
  }
  const oldPayment = store.state.payment;
  console.log("count", count)
  if (0 == count) {
    // const lastPayment = await payments.get(store.state.payment.id);
    // paymentCustomFields = prepareUnifiedCheckoutCardCustomFields(//TODO:new chages changed func name
    //   lastPayment,
    //   customerIpAddress,
    //   deviceFingerprintId,
    //   Constants
    // );
    console.log("under if of uc", JSON.stringify(paymentData));
    if (oldPayment?.id) {
      await payments.delete(oldPayment);
    }
    const payment = await createPaymentAsync(paymentData);
    store.dispatch(Constants.STRING_SET_PAYMENT, payment);
    paymentId = payment.id;
    if (payment.errors) {
      loading.value = false;
      error.value = Constants.ERROR_MSG_SUNRISE;
      handleError(payment, loading.value, error.value)
    }
    paymentId = payment.id;
    paymentCustomFields.id = payment.id;
    paymentCustomFields.version = payment.version;
    paymentCustomFields.body = {
      isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
      isv_userAgentHeader: navigator.userAgent,
      isv_customerIpAddress: customerIpAddress.value,
      isv_deviceFingerprintId: deviceFingerprintId,
    };
  } else {
    console.log("under else of uc", store.state.payment);
    // const lastPayment = await payments.get(store.state.payment.id);
    // paymentCustomFields = prepareUnifiedCheckoutCardCustomFields(//TODO:new chages changed func name
    //   lastPayment,
    //   customerIpAddress,
    //   deviceFingerprintId,
    //   Constants
    // );
    lastPayment = await payments.get(store.state.payment.id);//TODO:new chages changed func name
    console.log("last payment id", lastPayment?.id);
    paymentCustomFields.id = lastPayment?.id;
    paymentCustomFields.version = lastPayment.version;

    paymentCustomFields.body = {
      isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
      isv_userAgentHeader: navigator.userAgent,
      isv_customerIpAddress: customerIpAddress.value,
      isv_deviceFingerprintId: deviceFingerprintId,
    };
  }
  if (Constants.STRING_TRUE == PayerAuthenticationFlag && Constants.CC_WITH_PAYER_AUTH == paymentData.paymentMethodInfo.method) {
    console.log("last payment id", paymentCustomFields?.id);
    let updateResult = await handleUCPayerAuthentication(
      paymentCustomFields,
      loading,
      error,
    );

    if (Constants.STRING_TRUE == PayerAuthenticationFlag) {
      if (!(await handleBillingAndShipping(store, me, updateMyCart, loading, PayerAuthenticationFlag)))
        return;
      console.log("line 110", transactionId.value)
      let handlePayerAuth = await handlePayerAuthentication(updateResult, loading, isShow, count);
      // if (!(await handlePayerAuthentication(updateResult,loading,isShow,count))) return;
      if (!handlePayerAuth) {
        paymentProcessingInfo.paymentId = updateResult.id;
        return paymentProcessingInfo
      }
      else {
        updateResult = handlePayerAuth.updateResult;
        paymentProcessingInfo.count = handlePayerAuth.count;
        paymentProcessingInfo.payerAuthenticationRequired = handlePayerAuth.payerAuthenticationRequired;
        if (
          Constants.ISV_PAYER_AUTHENTICATION_TRANSACTION_ID in
          updateResult.custom.fields && transactionId.value
        ) {
          paymentCustomFields.id = updateResult.id;
          paymentCustomFields.version = updateResult.version;
          paymentCustomFields.body = transactionId.value;
          paymentProcessingInfo.updateResult = await payments.updateTransactionId(
            paymentCustomFields
          );
          console.log("Line 124 updateresult", updateResult);
          paymentId = updateResult.id
        }
      }
    }
  }
  paymentProcessingInfo.paymentId = paymentId;
  return paymentProcessingInfo;
}

function handlePaymentMethodCC(PayerAuthenticationFlag) {
  return {
    method:
      PayerAuthenticationFlag == Constants.STRING_TRUE
        ? Constants.CC_WITH_PAYER_AUTH
        : Constants.CREDIT_CARD,
    name: {
      en:
        PayerAuthenticationFlag == Constants.STRING_TRUE
          ? Constants.CC_WITH_PAYER_AUTH_EN
          : Constants.CREDIT_CARD_EN,
    },
  };
}

async function handleTransientToken(transientToken, props, Constants, PaymentMethods, customerIpAddress, PayerAuthenticationFlag, me) {
  const transientTokenData = jwt_decode(transientToken);
  let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
  const paymentData = { amountPlanned: cartDetails.totalPrice.centAmount };
  if (transientTokenData?.content?.processingInformation) {
    paymentData.paymentMethodInfo = handlePaymentSolution(
      transientTokenData.content.processingInformation.paymentSolution.value,
      Constants
    );
  } else {
    paymentData.paymentMethodInfo = handlePaymentMethodCC(
      PayerAuthenticationFlag
    );
  }
  if (
    Constants.STRING_CARD in
    transientTokenData.content.paymentInformation
  ) {
    paymentData.custom = await prepareUnifiedCheckoutCardCustomFields(null, customerIpAddress, PaymentMethods);
  } else {
    paymentData.custom = await prepareGpayUnifiedCheckoutwithoutCardCustomFields(customerIpAddress, PaymentMethods);
  }
  return paymentData;
}

function handlePaymentSolution(paymentSolution) {
  if ("012" === paymentSolution) {
    return {
      method: Constants.GOOGLE_PAY,
      name: { en: Constants.GOOGLE_PAY_EN },
    };
  } else if ("027" === paymentSolution) {
    return {
      method: Constants.VISA_CHECKOUT,
      name: { en: Constants.VISA_CHECKOUT_EN },
    };
  }
}

async function handleUCPayerAuthentication(
  paymentCustomFields,
  loading,
  error,
) {
  console.log("Line 609", JSON.stringify(paymentCustomFields))
  const updateResult = await payments.updateCustomFields(paymentCustomFields);
  console.log("Line 611", JSON.stringify(updateResult))
  if (updateResult.errors) {
    loading.value = false;
    error.value = Constants.ERROR_MSG_SUNRISE;
    handleError(updateResult, loading.value, error.value);
  }
  return updateResult;
}

function validateExpiryDate(body) {
  let month = body.isv_cardExpiryMonth;
  let year = body.isv_cardExpiryYear;
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth() + Constants.NUMBER_ONE;
  let currentYear = currentDate.getFullYear();
  return year === currentYear && month < currentMonth;
}

async function handleBillingAndShipping(store, me, updateMyCart, loading, PayerAuthenticationFlag) {
  let setBillingResult, setShippingResult;
  if (Constants.STRING_TRUE == process.env.VUE_APP_ENABLE_MULTIPLE_SHIPPING && Constants.STRING_TRUE == PayerAuthenticationFlag) {
    setBillingResult = await setCartBillingAddressMultiple(store, me, loading);
  } else {
    setBillingResult = await setCartBillingAddress(store, me, updateMyCart);
    setShippingResult = await setCartShippingAddress(store, me, updateMyCart);
  }
  if (!setBillingResult || !setShippingResult) {
    handleError(Constants.ERROR_MSG_FILL_REQUIRED_DATA);
    return false;
  }
  return true;
}

const callPayerAuthentication = async (
  action,
  inputValue,
  ddcCallbackResolve
) => {
  var cardinalCollectionForm;
  var cardinal_collection_form_input;
  cardinalCollectionForm = document.querySelector("#cardinal_collection_form");
  cardinalCollectionForm.action = action;
  cardinal_collection_form_input = document.querySelector(
    "#cardinal_collection_form_input"
  );
  cardinal_collection_form_input.value = inputValue;
  cardinalCollectionForm.submit();
  await new Promise(function (resolve) {
    sharedState.ddcCallbackResolve = resolve;
  });
  return ddcCallbackResolve;
};

async function handlePayerAuthentication(updateResult, loading, isShow, count) {
  if (
    Constants.ISV_DDC_URL in updateResult.custom.fields &&
    Constants.ISV_REQUEST_JWT in updateResult.custom.fields
  ) {
    let action = updateResult.custom.fields.isv_deviceDataCollectionUrl;
    let inputValue = updateResult.custom.fields.isv_requestJwt;
    await callPayerAuthentication(action, inputValue);
    updateResult = await updateBrowserInfo(updateResult);
    console.log("Payerauth update res", JSON.stringify(updateResult))
    if (updateResult.errors) {
      handleError(updateResult.statusCode);
      return false;
    }
    if (
      Constants.ISV_PAYER_AUTHENTICATION_REQUIRED in updateResult.custom.fields
    ) {
      let payerAuthenticationRequired =
        updateResult.custom.fields
          .isv_payerAuthenticationRequired;
      console.log("Before count", count)
      count = count + Constants.NUMBER_ONE;
      console.log("after count", count)
      await processPayerAuthentication(updateResult, loading, isShow);
      let response = {
        updateResult: updateResult,
        count: count,
        payerAuthenticationRequired: payerAuthenticationRequired
      }
      return response;
    }

  }
  handleError(Constants.ERROR_MSG_SUNRISE);
  return false;
}

async function processPayerAuthentication(updateResult, loading, isShow) {
  let payerAuthenticationRequired =
    updateResult.custom.fields.isv_payerAuthenticationRequired;

  if (
    payerAuthenticationRequired &&
    Constants.ISV_STEPUP_URL in updateResult.custom.fields
  ) {
    let stepUpForm = document.querySelector("#step-up-form");
    stepUpForm.action = updateResult.custom.fields.isv_stepUpUrl;
    let stepUpFormInput = document.querySelector("#step-up-formInput");
    stepUpFormInput.value = encodeURIComponent(
      updateResult.custom.fields.isv_responseJwt
    );
    stepUpForm.submit();
    loading.value = false;
    isShow.value = true;
    console.log(loading);
    console.log("Line 603")
    return new Promise((resolve) => {
      sharedState.validationCallBackResolve = resolve;
    });
  }
  return false;
}

const savedTokenFunc = async (
  savedToken,
  lastPayment,
  store,
  customerSavedToken,
  PayerAuthenticationFlag,
  deviceFingerprintId,
  error
) => {
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
  let paymentProcessingInfo = {
    paymentId: "",
    loading: true
  };
  let paymentCustomFields = {
    id: null,
    version: null,
    body: null,
  };
  try {
    paymentData.amountPlanned.currencyCode =
      lastPayment.amountPlanned.currencyCode;
    paymentData.amountPlanned.centAmount = lastPayment.amountPlanned.centAmount;
    oldPayment = store.state.payment;
    oldPayment?.id && payments.delete(oldPayment);
    if (Constants.NUMBER_ZERO < customerSavedToken.length) {
      customerSavedToken.forEach((token) => {
        tokenData = JSON.parse(token);
        if (tokenData.paymentToken == savedToken) {
          paymentData.custom = prepareFlexMicroformPaymentFields(tokenData);
          isvSavedToken = tokenData.paymentToken;
          isvTokenAlias = tokenData.alias;
        }
      });
    }
    if (Constants.STRING_TRUE === PayerAuthenticationFlag) {
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
    console.log("Line 622 =>", paymentData)
    updateResult = await createPaymentAsync(paymentData);
    console.log("Line 624 =>", updateResult)
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
    paymentProcessingInfo.paymentId = false;
    paymentProcessingInfo.loading = false;
    error.value = Constants.ERROR_MSG_PAYMENT_PROCESS;
    return;
  }
  return updateResult;
};


