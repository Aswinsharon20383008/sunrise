/* eslint-disable no-unused-vars */
import { Constants } from "../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/Constants";
import { retrieveBrowserInformation } from "./commonMixin";

const multiMid = process.env.VUE_APP_USE_MULTI_MID;
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;
const prepareVisaCheckoutPaymentFields = async (deviceFingerprintId,saleFlagEnabled,shippingMethod,userContext) => {
    var visaChktCallId;
    var paymentCustomFields;
    var multimidId = Constants.EMPTY_STRING;
    const browserInfo =  retrieveBrowserInformation();
    if (
      multiMid == Constants.STRING_TRUE &&
      multimidIdentifier != Constants.EMPTY_STRING &&
      multimidIdentifier != undefined
    ) {
      multimidId = multimidIdentifier;
    }
    return new Promise((resolve, reject) => {
      visaChktCallId = userContext.PaymentMethods.visaCheckout.visaCallId;
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
            isv_customerIpAddress: userContext.customerIpAddress,
            isv_saleEnabled: saleFlagEnabled,
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

  export {
    prepareVisaCheckoutPaymentFields
  }