/* eslint-disable no-shadow */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import {
  withToken,
  fetchJson,
  makeConfig,
  baseUrl,
} from "../../../../../../api/api";
import { Constants } from "../Constants";

const myPayments = {
  get: withToken((id, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_GET,
    })
  ),
  create: withToken((body, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify(body),
    })
  ),
  delete: withToken(({ id, version }, accessToken) => {
    const url = new URL(`${baseUrl}/me/payments/${id}`);
    url.searchParams.append(Constants.STRING_VERSION, version);
    url.searchParams.append(Constants.STRING_DATA_ERASURE, true);
    fetchJson(url, {
      ...makeConfig(accessToken),
      method: Constants.DELETE,
    });
  }),
  addTransaction: withToken(({ id, version, amountPlanned }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.ADD_TRANSACTION,
            transaction: {
              type: Constants.AUTHORIZATION,
              timestamp: new Date(Date.now()).toISOString(),
              amount: amountPlanned,
              state: Constants.INITIAL,
            },
          },
        ],
      }),
    })
  ),
  addSaleTransaction: withToken(({ id, version, amountPlanned }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.ADD_TRANSACTION,
            transaction: {
              type: Constants.CHARGE,
              timestamp: new Date(Date.now()).toISOString(),
              amount: amountPlanned,
              state: Constants.INITIAL,
            },
          },
        ],
      }),
    })
  ),
  update: withToken(({ id, version, body }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN,
            value: body.isv_token,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_MASKED_PAN,
            value: body.isv_maskedPan,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_TYPE,
            value: body.isv_cardType,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_MONTH,
            value: body.isv_cardExpiryMonth,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_YEAR,
            value: body.isv_cardExpiryYear,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_DEVICE_FINGERPRINT_ID,
            value: body.isv_deviceFingerprintId,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CUSTOMER_IP_ADDRESS,
            value: body.isv_customerIpAddress,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_SALE_ENABLED,
            value: body.isv_saleEnabled,
          },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_screenHeight",
          //   value: body.isv_screenHeight,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_screenWidth",
          //   value: body.isv_screenWidth,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_javaScriptEnabled",
          //   value: body.isv_javaScriptEnabled,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_javaEnabled",
          //   value: body.isv_javaEnabled,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_browserLanguage",
          //   value: body.isv_browserLanguage,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_colorDepth",
          //   value: body.isv_colorDepth,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_timeDifference",
          //   value: body.isv_timeDifference,
          // }
        ],
      }),
    })
  ),
  updateWithTokenAlias: withToken(({ id, version, body }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN,
            value: body.isv_token,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_MASKED_PAN,
            value: body.isv_maskedPan,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_TYPE,
            value: body.isv_cardType,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_MONTH,
            value: body.isv_cardExpiryMonth,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CARD_EXPIRY_YEAR,
            value: body.isv_cardExpiryYear,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_DEVICE_FINGERPRINT_ID,
            value: body.isv_deviceFingerprintId,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CUSTOMER_IP_ADDRESS,
            value: body.isv_customerIpAddress,
          },//aded
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_ALIAS,
            value: body.tokenAlias,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_SALE_ENABLED,
            value: body.isv_saleEnabled,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: "isv_merchantId",
            value: body.isv_merchantId,
          },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_javaScriptEnabled",
          //   value: body.isv_javaScriptEnabled,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_javaEnabled",
          //   value: body.isv_javaEnabled,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_browserLanguage",
          //   value: body.isv_browserLanguage,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_colorDepth",
          //   value: body.isv_colorDepth,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_screenHeight",
          //   value: body.isv_screenHeight,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_screenWidth",
          //   value: body.isv_screenWidth,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_timeDifference",
          //   value: body.isv_timeDifference,
          // }
        ],
      }),
    })
  ),
  updateUserAgent: withToken(({ id, version, userAgentHeader, screenHeight, screenWidth }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_USER_AGENT_HEADER,
            value: userAgentHeader,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_ACCEPT_HEADER,
            value: Constants.ISV_ACCEPT_HEADER_VALUE,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: "isv_screenHeight",
            value: screenHeight,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: "isv_screenWidth",
            value: screenWidth,
          },
        ],
      }),
    })
  ),
  updateSaveToken: withToken(({ id, version, body }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_SAVED_TOKEN,
            value: body.isv_savedToken,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN_ALIAS,
            value: body.isv_tokenAlias,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_DEVICE_FINGERPRINT_ID,
            value: body.isv_deviceFingerprintId,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_SECURITY_CODE,
            value: body.isv_securityCode,
          },
        ],
      }),
    })
  ),
  updateApplePayToken: withToken(({ id, version, body,sale}, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_TOKEN,
            value: body,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_SALE_ENABLED,
            value: sale,
          },
        ],
      }),
    })
  ),
  updateTransactionId: withToken(({ id, version, body }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_PAYER_AUTHENTICATION_TRANSACTION_ID,
            value: body,
          }
        ],
      }),
    })
  ),
  updateCustomFields: withToken(
    ({ id, version, body }, accessToken) =>
    fetchJson(`${baseUrl}/me/payments/${id}`, {
      ...makeConfig(accessToken),
      method: Constants.HTTP_METHOD_POST,
      body: JSON.stringify({
        version: version,
        actions: [
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_USER_AGENT_HEADER,
            value: body.isv_userAgentHeader,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_ACCEPT_HEADER,
            value: Constants.ISV_ACCEPT_HEADER_VALUE,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_DEVICE_FINGERPRINT_ID,
            value: body.isv_deviceFingerprintId,
          },
          {
            action: Constants.SET_CUSTOM_FIELD,
            name: Constants.ISV_CUSTOMER_IP_ADDRESS,
            value: body.isv_customerIpAddress,
          },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_javaScriptEnabled",
          //   value: body.isv_javaScriptEnabled,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_javaEnabled",
          //   value: body.isv_javaEnabled,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_browserLanguage",
          //   value: body.isv_browserLanguage,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_colorDepth",
          //   value: body.isv_colorDepth,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_screenHeight",
          //   value: body.isv_screenHeight,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_screenWidth",
          //   value: body.isv_screenWidth,
          // },
          // {
          //   action: Constants.SET_CUSTOM_FIELD,
          //   name: "isv_timeDifference",
          //   value: body.isv_timeDifference,
          // }
        ],
      }),
    })
  
  ),
};

export default myPayments;