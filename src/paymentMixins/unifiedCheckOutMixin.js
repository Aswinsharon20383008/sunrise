import { Constants } from "../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/Constants";
import jwt_decode from 'jwt-decode'; 

const multiMid = process.env.VUE_APP_USE_MULTI_MID;
const multimidIdentifier = process.env.VUE_APP_USE_MULTI_MID_ID;

const prepareUnifiedCheckoutCardCustomFields = async(tokens,saleFlagEnabled,deviceFingerprintId,shippingMethod,userContext) => {
    var unifiedCheckoutData;
    var paymentCustomFields;
    var multimidId;
    // const browserInfo = await this.retrieveBrowserInformation();
    if (
      multiMid == Constants.STRING_TRUE &&
      multimidIdentifier != Constants.EMPTY_STRING &&
      multimidIdentifier != undefined
    ) {
      multimidId = multimidIdentifier;
    }
    if (null == tokens) {
      return new Promise((resolve, reject) => {
        unifiedCheckoutData = jwt_decode(
          userContext.PaymentMethods.unifiedCheckout.transientToken
        );
        try {
          paymentCustomFields = {
            type: {
              key: Constants.PAYMENT_INTERFACE_TYPE,
            },
            fields: {
              isv_transientToken: userContext.PaymentMethods.unifiedCheckout
                .transientToken,
              isv_maskedPan:
                unifiedCheckoutData.content.paymentInformation.card.number
                  .bin +
                unifiedCheckoutData.content.paymentInformation.card.number
                  .maskedValue,
              isv_cardType:
                unifiedCheckoutData.content.paymentInformation.card.type
                  .value,
              isv_cardExpiryMonth:
                unifiedCheckoutData.content.paymentInformation.card
                  .expirationMonth.value,
              isv_cardExpiryYear:
                unifiedCheckoutData.content.paymentInformation.card
                  .expirationYear.value,
              isv_saleEnabled: saleFlagEnabled,
              isv_merchantId: multimidId,
              isv_deviceFingerprintId: deviceFingerprintId,
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
          isv_customerIpAddress: userContext.customerIpAddress,
          isv_saleEnabled: saleFlagEnabled,
          isv_merchantId: multimidId,
          isv_savedToken: tokens.paymentToken,
          isv_deviceFingerprintId: deviceFingerprintId,
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
      return paymentCustomFields;
    }
  }

  const prepareGpayUnifiedCheckoutwithoutCardCustomFields = async (deviceFingerprintId,saleFlagEnabled,shippingMethod,userContext)=>{
    var paymentCustomFields;
    var multimidId;
    // const browserInfo = await this.retrieveBrowserInformation();
    if (
      multiMid == Constants.STRING_TRUE &&
      multimidIdentifier != Constants.EMPTY_STRING &&
      multimidIdentifier != undefined
    ) {
      multimidId = multimidIdentifier;
    }
    return new Promise((resolve, reject) => {
      try {
        paymentCustomFields = {
          type: {
            key: Constants.PAYMENT_INTERFACE_TYPE,
          },
          fields: {
            isv_transientToken: userContext.PaymentMethods.unifiedCheckout
              .transientToken,
            isv_acceptHeader: Constants.ISV_ACCEPT_HEADER_VALUE,
            isv_userAgentHeader: navigator.userAgent,
            isv_customerIpAddress: userContext.customerIpAddress,
            isv_deviceFingerprintId: deviceFingerprintId,
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

  export{
    prepareUnifiedCheckoutCardCustomFields,
    prepareGpayUnifiedCheckoutwithoutCardCustomFields
  }