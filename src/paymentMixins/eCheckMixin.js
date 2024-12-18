import { Constants } from "../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/Constants";

const multiMid = process.env.VUE_APP_USE_MULTI_MID;
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;

const prepareECheckCustomFields = async(deviceFingerprintId,shippingMethod,userContext) => {
    var paymentCustomFields;
    var multimidId = Constants.EMPTY_STRING;
    // const browserInfo = await  this.retrieveBrowserInformation();
    if (
      multiMid == Constants.STRING_TRUE &&
      multimidIdentifier != Constants.EMPTY_STRING &&
      multimidIdentifier != undefined
    ) {
      multimidId = multimidIdentifier;
    }
    var paymentInformation = {
      accountNumber: null,
      accountType: null,
      routingNumber: null,
    };
    return new Promise((resolve, reject) => {
      paymentInformation.accountNumber = document.querySelector(
        "#accountNumber"
      ).value;
      paymentInformation.accountType = document.querySelector(
        "#accountType"
      ).value;
      paymentInformation.routingNumber = document.querySelector(
        "#routingNumber"
      ).value;
      try {
        paymentCustomFields = {
          type: {
            key: Constants.PAYMENT_INTERFACE_TYPE,
          },
          fields: {
            isv_deviceFingerprintId: deviceFingerprintId,
            isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
            isv_userAgentHeader: navigator.userAgent,
            isv_customerIpAddress: userContext.customerIpAddress,
            isv_accountNumber: paymentInformation.accountNumber,
            isv_accountType: paymentInformation.accountType,
            isv_routingNumber: paymentInformation.routingNumber,
            isv_merchantId: multimidId,
            isv_shippingMethod: shippingMethod,
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
  }

  export{
    prepareECheckCustomFields
  }