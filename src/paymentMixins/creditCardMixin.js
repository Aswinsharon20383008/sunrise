/* eslint-disable no-console */

import { Constants } from "../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/Constants";
import jwt_decode from 'jwt-decode';
import ipAddress from "../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/api/ipAddress";
import { retrieveBrowserInformation } from "./commonMixin";



const multiMid = process.env.VUE_APP_USE_MULTI_MID;
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;
const prepareFlexMicroformPaymentFields =  async(tokens,count,deviceFingerprintId,shippingMethod,saleFlagEnabled,PaymentMethods)=> {
    let customerIpAddress = await ipAddress.getIpAddress();
    var microform;
    var options;
    var flexData;
    var paymentCustomFields;
    var multimidId = Constants.EMPTY_STRING;
    if (
      multiMid == Constants.STRING_TRUE &&
      multimidIdentifier != Constants.EMPTY_STRING &&
      multimidIdentifier != undefined
    ) {
      multimidId = multimidIdentifier;
    }
    const browserInfo = await retrieveBrowserInformation();
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
                isv_maskedPan:
                  flexData.content.paymentInformation.card.number.bin +
                  flexData.content.paymentInformation.card.number.maskedValue,
                isv_cardType:
                  flexData.content.paymentInformation.card.number
                    .detectedCardTypes[0],
                isv_cardExpiryMonth:
                  flexData.content.paymentInformation.card.expirationMonth
                    .value,
                isv_cardExpiryYear:
                  flexData.content.paymentInformation.card.expirationYear
                    .value,
                isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
                isv_deviceFingerprintId: deviceFingerprintId,
                isv_shippingMethod: shippingMethod,
                isv_customerIpAddress: customerIpAddress,
                isv_saleEnabled: saleFlagEnabled,
                isv_merchantId: multimidId,
                isv_screenHeight: browserInfo.isv_screenHeight,
                isv_screenWidth: browserInfo.isv_screenWidth,
              };
              resolve(paymentCustomFields);
            } catch (e) {
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
          isv_shippingMethod: shippingMethod,
          isv_userAgentHeader: navigator.userAgent,
          isv_customerIpAddress: customerIpAddress,
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
      };
    } else if (tokens && count) {
      paymentCustomFields = {
        fields: {
          isv_maskedPan: tokens.cardNumber,
          isv_cardType: tokens.cardType,
          isv_cardExpiryMonth: tokens.cardExpiryMonth,
          isv_cardExpiryYear: tokens.cardExpiryYear,
          isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
          isv_userAgentHeader: navigator.userAgent,
          isv_shippingMethod: shippingMethod,
          isv_customerIpAddress: customerIpAddress,
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
      };
    }
    return paymentCustomFields;
  }

  export {
    prepareFlexMicroformPaymentFields
  }