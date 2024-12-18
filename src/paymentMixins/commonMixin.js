/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
import { Constants } from "../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/Constants";
import cartApi from "../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/api/cart";

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

const PayerAuthenticationFlag = process.env.VUE_APP_USE_PAYER_AUTHENTICATION;

const retrieveBrowserInformation = async() => {
    let browserInfo = {
      // isv_javaScriptEnabled : '',
      // isv_javaEnabled : '',
      // isv_browserLanguage : '',
      // isv_colorDepth : '',
      isv_screenHeight: "",
      isv_screenWidth: "",
      //isv_timeDifference : ''
    };
    // if(null != deviceFingerprintId) {
    //   browserInfo.isv_javaScriptEnabled = true;
    // } else {
    //   browserInfo.isv_javaScriptEnabled = false;
    // }
    // browserInfo.isv_javaEnabled = navigator.javaEnabled();
    // browserInfo.isv_browserLanguage = navigator.language;
    // browserInfo.isv_colorDepth = screen.colorDepth;
    browserInfo.isv_screenHeight = window.screen.height;
    browserInfo.isv_screenWidth = window.screen.width;
    // const d = new Date();
    // browserInfo.isv_timeDifference = d.getTimezoneOffset();
    return browserInfo;
}


const setCartBillingAddressMultiple = async(userContext) => {
    userContext.loading = true;
    var address;
    var billingAddress;
    var cartBillingObject;
    var billingObject = {
      id: userContext.me.activeCart.id,
      version: userContext.me.activeCart.version,
      body: {},
    };
    if (
      Constants.STRING_TRUE == enableUCBillingAddress &&
      Constants.STRING_TRUE == unifiedCheckoutFlag &&
      Constants.STRING_TRUE == PayerAuthenticationFlag
    ) {
      var cartObject = await cartApi.get(userContext.me.activeCart.id);
      userContext.me.activeCart.version = cartObject.version;
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
        userContext.me.activeCart = cartBillingObject;
        return cartBillingObject;
      }
    } else if (
      document.querySelector(".checkout-main-area").parentElement.__vue__
        .validBillingForm
    ) {
      address = document.querySelector(".checkout-main-area").parentElement
        .__vue__.billingAddress;
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
      userContext.me.activeCart = cartBillingObject;
      return cartBillingObject;
    }
  }

  const setCartBillingAddress = async(userContext) => {
    var address;
    var billingAddress;
    var cartObject = await cartApi.get(userContext.me.activeCart.id);
    userContext.me.activeCart.version = cartObject.version;
    // if (
    //   Constants.STRING_TRUE == enableUCBillingAddress &&
    //   Constants.STRING_TRUE == unifiedCheckoutFlag &&
    //   Constants.STRING_TRUE == PayerAuthenticationFlag &&
    //   null != cartObject &&
    //   undefined != cartObject &&
    //   cartObject?.billingAddress &&
    //   null != cartObject.billingAddress.firstName &&
    //   undefined != cartObject.billingAddress.firstName
    // ) {
    //   billingAddress = {
    //     firstName: cartObject.billingAddress.firstName,
    //     lastName: cartObject.billingAddress.lastName,
    //     streetName: cartObject.billingAddress.streetName,
    //     additionalStreetInfo:
    //       cartObject?.billingAddress.additionalStreetInfo || "",
    //     city: cartObject.billingAddress.city,
    //     postalCode: cartObject.billingAddress.postalCode,
    //     region: cartObject.billingAddress.region,
    //     country: cartObject.billingAddress.country,
    //     email: cartObject.billingAddress.email,
    //     phone: cartObject.billingAddress.phone,
    //   };
    //   return this.updateMyCart([
    //     {
    //       setBillingAddress: {
    //         address: billingAddress,
    //       },
    //     },
    //   ]);
    // } else
    //TODO: error fix
    if (
      document.querySelector(".checkout-main-area").parentElement.__vue__
        .validBillingForm
    ) {
      address = document.querySelector(".checkout-main-area").parentElement
        .__vue__.billingAddress;
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
      return userContext.updateMyCart([
        {
          setBillingAddress: {
            address: billingAddress,
          },
        },
      ]);
    }
  }

  const setCartShippingAddress = async(userContext) => {
    var address;
    var billingAddress;
    var cartObject = await cartApi.get(userContext.me.activeCart.id);
    userContext.me.activeCart.version = cartObject.version;
    // if (
    //   Constants.STRING_TRUE == enableUCShippingAddress &&
    //   Constants.STRING_TRUE == unifiedCheckoutFlag &&
    //   Constants.STRING_TRUE == PayerAuthenticationFlag &&
    //   null != cartObject &&
    //   undefined != cartObject &&
    //   cartObject?.shippingAddress &&
    //   cartObject.shippingAddress?.firstName
    // ) {
    //   billingAddress = {
    //     firstName: cartObject.shippingAddress.firstName,
    //     lastName: cartObject.shippingAddress.lastName,
    //     streetName: cartObject.shippingAddress.streetName,
    //     additionalStreetInfo:
    //       cartObject?.shippingAddress.additionalStreetInfo || "",
    //     city: cartObject.shippingAddress.city,
    //     postalCode: cartObject.shippingAddress.postalCode,
    //     region: cartObject.shippingAddress.region,
    //     country: cartObject.shippingAddress.country,
    //     email: cartObject.shippingAddress.email,
    //     phone: cartObject.shippingAddress.phone,
    //   };
    //   return this.updateMyCart([
    //     {
    //       setShippingAddress: {
    //         address: billingAddress,
    //       },
    //     },
    //   ]);
    // } else
    //TODO: error fix
    if (
      document.querySelector(".checkout-main-area").parentElement.__vue__
        .validShippingForm
    ) {
      address = document.querySelector(".checkout-main-area").parentElement
        .__vue__.shippingAddress;
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

        return userContext.updateMyCart([
          {
            setShippingAddress: {
              address: billingAddress,
            },
          },
        ]);
      } else {
        /* eslint no-underscore-dangle: ["error", { "allow": ["__vue__"] }]*/
        if (
          document.querySelector(".checkout-main-area").parentElement.__vue__
            .validBillingForm
        ) {
          address = document.querySelector(".checkout-main-area")
            .parentElement.__vue__.billingAddress;
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
          return userContext.updateMyCart([
            {
              setShippingAddress: {
                address: billingAddress,
              },
            },
          ]);
        }
      }
    }
  }  

  

  export {
    retrieveBrowserInformation,
    setCartBillingAddressMultiple,
    setCartBillingAddress,
    setCartShippingAddress
  }