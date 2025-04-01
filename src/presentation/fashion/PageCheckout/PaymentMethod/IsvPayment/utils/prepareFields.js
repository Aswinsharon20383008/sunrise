import { v4 as uuidv4 } from "uuid";
import jwt_decode from "jwt-decode";
import { Constants } from "../Constants";
import payments from "../api/payments";
// import { mapAddress } from "./objectMapper";
import cartApi from "../api/cart";
const PayerAuthenticationFlag = process.env.VUE_APP_USE_PAYER_AUTHENTICATION;
const saleFlag = process.env.VUE_APP_USE_SALE;
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;

const unifiedCheckoutFlag = process.env.VUE_APP_USE_UNIFIED_CHECKOUT || "false";
const enableUCBillingAddress =
  process.env.VUE_APP_USE_UC_BILLING_ADDRESS || "false";
// const enableUCShippingAddress =
//   process.env.VUE_APP_USE_UC_SHIPPING_ADDRESS || "false";
const shippingMethod = process.env.VUE_APP_USE_SHIPPING_METHOD || "";

const multiMid = process.env.VUE_APP_USE_MULTI_MID;
const deviceFingerprintId = uuidv4();

let metaData = {
  "1": "testValue1",
  "2": "testValue2"
}

export const retrieveBrowserInformation = () => {
  let browserInfo = {
    isv_screenHeight: "",
    isv_screenWidth: "",
  };
  browserInfo.isv_screenHeight = window.screen.height;
  browserInfo.isv_screenWidth = window.screen.width;
  return browserInfo;
};

export const prepareUnifiedCheckoutCardCustomFields = (
  tokens,
  customerIpAddress,
  PaymentMethods
) => {
  let unifiedCheckoutData;
  let paymentCustomFields;
  let multimidId = "";
  let isSaleScenario = saleFlag === "true" ? true : false;
  if ("true" === multiMid) {
    multimidId = multimidIdentifier;
  }
  if (!tokens) {
    return new Promise((resolve, reject) => {
      unifiedCheckoutData = jwt_decode(
        PaymentMethods.unifiedCheckout.transientToken
      );
      try {
        paymentCustomFields = {
          type: {
            key: Constants.PAYMENT_INTERFACE_TYPE,
          },
          fields: {
            isv_transientToken: PaymentMethods.unifiedCheckout.transientToken,
            isv_maskedPan:
              unifiedCheckoutData.content.paymentInformation.card.number.bin +
              unifiedCheckoutData.content.paymentInformation.card.number
                .maskedValue,
            isv_cardType:
              unifiedCheckoutData.content.paymentInformation.card.type.value,
            isv_cardExpiryMonth:
              unifiedCheckoutData.content.paymentInformation.card
                .expirationMonth.value,
            isv_cardExpiryYear:
              unifiedCheckoutData.content.paymentInformation.card.expirationYear
                .value,
            isv_saleEnabled: isSaleScenario,
            isv_merchantId: multimidId,
            isv_deviceFingerprintId: deviceFingerprintId,
            isv_shippingMethod: shippingMethod,
            isv_metadata: JSON.stringify(metaData),
          },
        };
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
        isv_saleEnabled: isSaleScenario,
        isv_merchantId: multimidId,
        isv_savedToken: tokens.paymentToken,
        isv_deviceFingerprintId: deviceFingerprintId,
        isv_shippingMethod: shippingMethod,
        isv_metadata: JSON.stringify(metaData),
      },
    };
    return paymentCustomFields;
  }
};


export const prepareFlexMicroformPaymentFields = (
  tokens,
  count,
  customerIpAddress,
  paymentMethodsObject
) => {
  let multimidId = Constants.EMPTY_STRING;
  let isSaleScenario = saleFlag === "true" ? true : false;
  if (Constants.STRING_TRUE === multiMid && multimidIdentifier) {
    multimidId = multimidIdentifier;
  }
  const browserInfo = retrieveBrowserInformation();

  if (!tokens && (count === 0 || count > 0)) {
    return new Promise((resolve, reject) => {
      const microform = paymentMethodsObject.flexMicroform.flexMicroFormObject;
      const options = {
        expirationMonth: document.querySelector("#expMonth").value,
        expirationYear: document.querySelector("#expYear").value,
      };

      microform.createToken(options, (err, jwtToken) => {
        if (err) {
          return reject(err.message);
        }
        try {
          const flexData = jwt_decode(jwtToken);
          const paymentCustomFields = {
            isv_token: jwtToken,
            isv_maskedPan: `${flexData.content.paymentInformation.card.number.bin}${flexData.content.paymentInformation.card.number.maskedValue}`,
            isv_cardType:
              flexData.content.paymentInformation.card.number
                .detectedCardTypes[0],
            isv_cardExpiryMonth:
              flexData.content.paymentInformation.card.expirationMonth.value,
            isv_cardExpiryYear:
              flexData.content.paymentInformation.card.expirationYear.value,
            isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
            isv_deviceFingerprintId: deviceFingerprintId,
            isv_customerIpAddress: customerIpAddress,
            isv_shippingMethod: shippingMethod,
            isv_metadata: JSON.stringify(metaData),
            isv_saleEnabled: isSaleScenario,
            isv_merchantId: multimidId,
            isv_screenHeight: browserInfo.isv_screenHeight,
            isv_screenWidth: browserInfo.isv_screenWidth,
          };
          console.log(
            "paymentCustomFields",
            JSON.stringify(paymentCustomFields)
          );
          resolve(paymentCustomFields);
        } catch (e) {
          console.error("Error decoding JWT token:", e);
          reject(e);
        }
      });
    });
  }
  const baseFields = {
    isv_maskedPan: tokens?.cardNumber,
    isv_cardType: tokens?.cardType,
    isv_cardExpiryMonth: tokens?.cardExpiryMonth,
    isv_cardExpiryYear: tokens?.cardExpiryYear,
    isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
    isv_userAgentHeader: navigator?.userAgent,
    isv_customerIpAddress: customerIpAddress,
    isv_saleEnabled: isSaleScenario,
    isv_merchantId: multimidId,
    isv_screenHeight: browserInfo?.isv_screenHeight,
    isv_screenWidth: browserInfo?.isv_screenWidth,
    isv_shippingMethod: shippingMethod,
    isv_metadata: JSON.stringify(metaData)
  };
  if (tokens && !count) {
    return {
      type: { key: Constants.PAYMENT_INTERFACE_TYPE },
      fields: baseFields,
    };
  }
  if (tokens && count) {
    return { fields: baseFields };
  }
  console.log("prepared object", JSON.stringify());
  return {};
};

export const prepareECheckCustomFields = (customerIpAddress) => {
  var paymentCustomFields;
  var multimidId = Constants.EMPTY_STRING;
  // const browserInfo = await  this.retrieveBrowserInformation();
  if (Constants.STRING_TRUE === multiMid && multimidIdentifier) {
    multimidId = multimidIdentifier;
  }
  var paymentInformation = {
    accountNumber: null,
    accountType: null,
    routingNumber: null,
  };
  return new Promise((resolve, reject) => {
    paymentInformation.accountNumber =
      document.querySelector("#accountNumber").value;
    paymentInformation.accountType =
      document.querySelector("#accountType").value;
    paymentInformation.routingNumber =
      document.querySelector("#routingNumber").value;
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
          isv_shippingMethod: shippingMethod,
          isv_metadata: JSON.stringify(metaData)
        },
      };
      resolve(paymentCustomFields);
    } catch (e) {
      reject(e);
    }
  });
};

export const prepareGpayUnifiedCheckoutwithoutCardCustomFields = (
  customerIpAddress,
  PaymentMethods
) => {
  var paymentCustomFields;
  var multimidId;
  let isSaleScenario = saleFlag === "true" ? true : false;
  if (Constants.STRING_TRUE === multiMid && multimidIdentifier) {
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
          isv_saleEnabled: isSaleScenario,
          isv_merchantId: multimidId,
          isv_shippingMethod: shippingMethod,
          isv_metadata: JSON.stringify(metaData)
        },
      };
      resolve(paymentCustomFields);
    } catch (e) {
      reject(e);
    }
  });
};

export const prepareGooglePayPaymentFields = (
  PaymentMethods,
  customerIpAddress
) => {
  var paymentToken;
  var paymentCustomFields;
  var multimidId = Constants.EMPTY_STRING;
  let isSaleScenario = saleFlag === "true" ? true : false;
  // const browserInfo = await this.retrieveBrowserInformation();
  if (
    multiMid == Constants.STRING_TRUE &&
    multimidIdentifier != Constants.EMPTY_STRING &&
    multimidIdentifier != undefined
  ) {
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
          isv_saleEnabled: isSaleScenario,
          isv_merchantId: multimidId,
          isv_shippingMethod: shippingMethod,
          isv_metadata: JSON.stringify(metaData)
        },
      };
      resolve(paymentCustomFields);
    } catch (e) {
      console.log("error", e);
      reject(e);
    }
  });
};

export const prepareVisaCheckoutPaymentFields = (
  PaymentMethods,
  customerIpAddress
) => {
  var visaChktCallId;
  var paymentCustomFields;
  var multimidId = Constants.EMPTY_STRING;
  let isSaleScenario = saleFlag === "true" ? true : false;
  if (Constants.STRING_TRUE === multiMid && multimidIdentifier) {
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
          isv_saleEnabled: isSaleScenario,
          isv_merchantId: multimidId,
          isv_shippingMethod: shippingMethod,
          isv_metadata: JSON.stringify(metaData)
        },
      };
      resolve(paymentCustomFields);
    } catch (e) {
      reject(e);
    }
  });
};

export const savedTokenCustomFieldsRetry = async (
  savedToken,
  payment,
  customerSavedToken,
  me
) => {
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
  let cartDetails = await cartApi.getCart(me.value.activeCart.id || me.value.activeCart.cartId);
  paymentData.amountPlanned.currencyCode = cartDetails.totalPrice.currencyCode;
  paymentData.amountPlanned.centAmount = cartDetails.totalPrice.centAmount
  if (Constants.NUMBER_ZERO < customerSavedToken.length) {
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
  console.log(paymentId + "" + payemntVersion);
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

export const updateBrowserInfo = async (updateResult, loading) => {
  var updateTokenResult;
  let paymentCustomFields = {
    id: null,
    version: null,
    userAgentHeader: null,
    screenHeight: null,
    screenWidth: null,
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

export const preparePayPalPaymentFields = (customerIpAddress) => {
  let paymentCustomFields;
  let multimidId = Constants.EMPTY_STRING;
  let isSaleScenario = "true" == saleFlag ? true : false;
  if (Constants.STRING_TRUE == multiMid && multimidIdentifier) {
    multimidId = multimidIdentifier;
  }
  // const browserInfo = await this.retrieveBrowserInformation();
  return new Promise((resolve, reject) => {
    try {
      paymentCustomFields = {
        type: {
          key: Constants.PAYMENT_INTERFACE_TYPE,
        },
        fields: {
          isv_deviceFingerprintId: deviceFingerprintId,
          isv_customerIpAddress: customerIpAddress,
          isv_saleEnabled: isSaleScenario,
          isv_merchantId: multimidId,
          isv_shippingMethod: shippingMethod,
          isv_metadata: JSON.stringify(metaData),
        },
      };
      resolve(paymentCustomFields);
    } catch (e) {
      console.log("error", e);
      reject(e);
    }
  });
};

export const setCartBillingAddressMultiple = async (store, me, loading) => {
  loading.value = true;
  var address;
  var cartBillingObject;
  var billingObject = {
    id: me.value.activeCart.id,
    version: me.value.activeCart.version,
    body: {},
  };
  if (
    Constants.STRING_TRUE == enableUCBillingAddress &&
    Constants.STRING_TRUE == unifiedCheckoutFlag &&
    Constants.STRING_TRUE == PayerAuthenticationFlag
  ) {
    var cartObject = await cartApi.get(
      me?.value?.activeCart?.id || me?.value?.activeCart?.cartId
    );
    // this.me.activeCart.version = cartObject.version;
    me.value.activeCart = {
      ...me.value.activeCart,
      version: cartObject.version,
    };
    if (
      null != cartObject &&
      undefined != cartObject &&
      cartObject?.billingAddress &&
      cartObject?.billingAddress?.firstName
    ) {
      billingObject.body.firstName = cartObject.billingAddress.firstName;
      billingObject.body.lastName = cartObject.billingAddress.lastName;
      billingObject.body.streetName = cartObject.billingAddress.streetName;
      billingObject.body.additionalStreetInfo =
        cartObject?.additionalStreetInfo || "";
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
  } else if (store.state.validBillingForm) {
    address = store.state.billingAddress;
    billingObject.body.firstName = address.firstName;
    billingObject.body.lastName = address.lastName;
    billingObject.body.streetName = address.streetName;
    billingObject.body.additionalStreetInfo =
      address?.additionalStreetInfo || "";
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

export const setCartBillingAddress = async (store, me, updateMyCart) => {
  var address;
  var billingAddress;
  console.log(
    "cart id-->",
    me?.value?.activeCart?.id + "" + me?.value?.activeCart?.cartId
  );
  var cartObject = await cartApi.get(
    me?.value?.activeCart?.id || me?.value?.activeCart?.cartId
  );
  // me.value.activeCart.version = cartObject.version;
  me.value.activeCart = {
    ...me.value.activeCart,
    version: cartObject.version,
  };
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
      additionalStreetInfo: address?.additionalStreetInfo || "",
      city: address.city,
      postalCode: address.postalCode,
      region: address.region,
      country: address.country,
      email: address.email,
      phone: address.phone,
    };
    return updateMyCart(
      [
        {
          setBillingAddress: {
            address: billingAddress,
          },
        },
      ],
      me.value.activeCart
    );
  }
};

export const setCartShippingAddress = async (store, me, updateMyCart) => {
  var address;
  var billingAddress;
  var cartObject = await cartApi.get(
    me?.value?.activeCart?.id || me?.value?.activeCart?.cartId
  );
  // me.value.activeCart.version = cartObject.version;
  me.value.activeCart = {
    ...me.value.activeCart,
    version: cartObject.version,
  };
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
    address = store.state.shippingAddress; //todo:set shippingAddress
    if (null != address) {
      billingAddress = {
        firstName: address.firstName,
        lastName: address.lastName,
        streetName: address.streetName,
        additionalStreetInfo: address?.additionalStreetInfo || "",
        city: address.city,
        postalCode: address.postalCode,
        region: address.region,
        country: address.country,
        email: address.email,
        phone: address.phone,
      };
      return updateMyCart(
        [
          {
            setShippingAddress: {
              address: billingAddress,
            },
          },
        ],
        me.value.activeCart
      );
    } else {
      /* eslint no-underscore-dangle: ["error", { "allow": ["__vue__"] }]*/
      if (store.state.validBillingForm) {
        address = store.state.billingAddress;
        billingAddress = {
          firstName: address.firstName,
          lastName: address.lastName,
          streetName: address.streetName,
          additionalStreetInfo: address?.additionalStreetInfo || "",
          city: address.city,
          postalCode: address.postalCode,
          region: address.region,
          country: address.country,
          email: address.email,
          phone: address.phone,
        };
        return updateMyCart(
          [
            {
              setShippingAddress: {
                address: billingAddress,
              },
            },
          ],
          me.value.activeCart
        );
      }
    }
  }
};

export const addAddress = async (me, loading, store, customer, loggedInCustomer) => {
  var customerObject;
  var customerResponse;
  var updateObject = {
    version: null,
    address: null,
  };
  var billingAddress;
  var cartObject = await cartApi.get(
    me.value.activeCart.id || me.value.activeCart.cartId
  );
  me.value.activeCart = {
    ...me.value.activeCart,
    version: cartObject.version,
  };
  // me.value.activeCart.version = cartObject.version;
  console.log("line 2188", store.state.billingAddress);
  // const address = document.querySelector(".checkout-main-area").parentElement.__vue__.billingAddress;
  const address = store.state.billingAddress;
  console.log(
    "addr",
    store.state.billingAddress.firstName,
    address.firstName
  );
  billingAddress = {
    firstName: address.firstName,
    lastName: address.lastName,
    streetName: address.streetName,
    additionalStreetInfo: address?.additionalStreetInfo || "",
    city: address.city,
    postalCode: address.postalCode,
    region: address.region,
    country: address.country,
    email: address.email,
    phone: address?.phone,
  };
  loading.value = true;
  customerObject = await customer.getCustomer(loggedInCustomer.value);
  updateObject.address = billingAddress;
  updateObject.version = customerObject.version;
  customerResponse = await customer.updateAddress(updateObject);
  return customerResponse;
};
