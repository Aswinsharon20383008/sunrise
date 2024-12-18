import BillingDetails from './BillingDetails/BillingDetails.vue';
import OrderOverview from './OrderOverview/OrderOverview.vue';
import ServerError from 'presentation/components/ServerError/ServerError.vue';
import { shallowRef, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
// import { useRouter } from 'vue-router';
import useCart from 'hooks/useCart';
import useCartTools from 'hooks/useCartTools';
import { Constants } from '../PageCheckout/PaymentMethod/IsvPayment/Constants';
import cartApi from '../PageCheckout/PaymentMethod/IsvPayment/api/cart';
// import { updateMyCart, createMyOrder } from '../../../mixins/cartMixin';
import cartMixin from '../../../mixins/cartMixin';
// import {updateMyCart,createMyOrder} from '../../../mixins/cartMixin';
import BaseDate from '../components/BaseDate/BaseDate.vue';
import {useStore} from 'vuex';


// import { fetchCartData } from './PaymentMethod/IsvPayment/api/activeCart';

// const multipleShipping = process.env.VUE_APP_ENABLE_MULTIPLE_SHIPPING;
// const PayerAuthenticationFlag = process.env.VUE_APP_USE_PAYER_AUTHENTICATION;
// var unifiedCheckoutVariable = "false";
// if (undefined != process.env.VUE_APP_USE_UNIFIED_CHECKOUT) {
//   unifiedCheckoutVariable = process.env.VUE_APP_USE_UNIFIED_CHECKOUT;
// }
// // const unifiedCheckoutFlag = unifiedCheckoutVariable;
// var enableUCBillingAddressVariable = "false";
// if (undefined != process.env.VUE_APP_USE_UC_BILLING_ADDRESS) {
//   enableUCBillingAddressVariable = process.env.VUE_APP_USE_UC_BILLING_ADDRESS;
// }
// const enableUCBillingAddress = enableUCBillingAddressVariable;
// var enableUCShippingAddressVariable = "false";
// if (undefined != process.env.VUE_APP_USE_UC_SHIPPING_ADDRESS) {
//   enableUCShippingAddressVariable = process.env.VUE_APP_USE_UC_SHIPPING_ADDRESS;
// }
// const enableUCShippingAddress = enableUCShippingAddressVariable;

export default {
  components: {
    // CheckoutTopSection,
    OrderOverview,
    BillingDetails,
    ServerError,
    BaseDate
  },
  // mixins: [cartMixin],
  setup() {
    const me = ref({});
    const { t } = useI18n();
    const store =  useStore();
    // const router = useRouter();
    const shippingMethod = shallowRef(null);
    const paymentMethod = shallowRef('card');
    const error = shallowRef(null);
    const { cart, loading } = useCart();
    const cartTools = useCartTools();
    const {updateMyCart,createMyOrder} = cartMixin.setup();
    const orderComplete = ref(false);
    const showError = ref(false);
    const orderNumber = ref(null);
    const orderDate = ref(null);
    const billingAddress = ref(null);
    const shippingAddress = ref(null);
    const validBillingForm = ref(false);  // These refs are placeholders; 
    const validShippingForm = ref(false);
    // let isProcessing = false; // you'll need to replace with your logic
    // const multipleShipping = Constants.STRING_TRUE;  // Replace with actual value
    // const unifiedCheckoutFlag = Constants.STRING_TRUE; // Replace with actual value
    // const PayerAuthenticationFlag = Constants.STRING_TRUE; // Replace with actual value
    // const enableUCBillingAddress = Constants.STRING_TRUE; // Replace with actual value
    // const enableUCShippingAddress = Constants.STRING_TRUE;
    const multipleShipping = process.env.VUE_APP_ENABLE_MULTIPLE_SHIPPING;
const PayerAuthenticationFlag = process.env.VUE_APP_USE_PAYER_AUTHENTICATION;
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
const enableUCShippingAddress = enableUCShippingAddressVariable;
    //@todo: what happened to the payment method passed to this?
    me.value.activeCart = cart.value;

    const placeOrder = async (paymentid, actions) => {
      // if(isProcessing)return;
      try {
        console.log("place order called",paymentid,paymentid.value)
        // isProcessing = true;//todo:remove if any order getting impacted..same for paymentId too
        // let paymentId = paymentid._value;
        if(!me.value.activeCart){
          me.value.activeCart =  store.state.activeCart
        }
        const id = me.value.activeCart.cartId || me.value.activeCart.id;
        let cartObject = await cartApi.getCart(id);
        me.value.activeCart = cartObject;
        if (!validBillingForm.value || !validShippingForm.value) {
          showError.value = true;
          if (actions?.onValidationError) {
            actions.onValidationError();
          }
          return;
        }
        if (multipleShipping === Constants.STRING_TRUE) {
          await handleCheckoutFlow(cartObject, paymentid, actions);
        } else {
          await handleUnifiedCheckoutFlow(cartObject, paymentid, actions);
        }
      } catch (error) {
        console.error("Error during placeOrder:", error);
      }
      // finally{
      //   isProcessing = false;
      // }
    };

    const handleCheckoutFlow = async (cartObject, paymentid, actions) => {
      // Handle Payer Authentication and Update Cart with Billing Address
      if (unifiedCheckoutFlag === Constants.STRING_TRUE &&
        PayerAuthenticationFlag === Constants.STRING_TRUE &&
        enableUCBillingAddress === Constants.STRING_TRUE &&
        cartObject?.billingAddress?.firstName) {
        billingAddress.value = cartObject.billingAddress;
      }
      const updatedCart = await updateCartBillingAddress(billingAddress.value);
      me.value.activeCart = updatedCart;
      if (paymentid.value) {
        orderNumber.value = paymentid;
        orderDate.value = me.value.activeCart.createdAt
        await addPaymentToCart(paymentid);
      }
      await completeOrderActions(updatedCart, actions,paymentid);
    };

    const handleUnifiedCheckoutFlow = async (cartObject, paymentid, actions) => {
      // Handle both Billing and Shipping Address logic
      // if (unifiedCheckoutFlag === Constants.STRING_TRUE &&
      //   PayerAuthenticationFlag === Constants.STRING_TRUE &&
      //   enableUCShippingAddress === Constants.STRING_TRUE &&
      //   cartObject?.shippingAddress?.firstName) {
      //   shippingAddress.value = cartObject.shippingAddress;
      // } else {
      //   shippingAddress.value = billingAddress.value;
      // }
      console.log("func called 145")
      if (Constants.STRING_TRUE == unifiedCheckoutFlag && Constants.STRING_TRUE == PayerAuthenticationFlag && Constants.STRING_TRUE == enableUCBillingAddress && cartObject?.billingAddress?.firstName) {
        billingAddress.value = cartObject.billingAddress;
      }
      if (Constants.STRING_TRUE == unifiedCheckoutFlag && Constants.STRING_TRUE == enableUCShippingAddress && Constants.STRING_TRUE == PayerAuthenticationFlag && cartObject?.shippingAddress?.firstName) {
        shippingAddress.value = cartObject.shippingAddress;
      }
      let updatedCart = await updateCartBillingAddress(billingAddress.value);
      me.value.activeCart = updatedCart;
      if(!shippingAddress?.value?.firstName || !updatedCart?.shippingAddress?.firstName){
       if(Constants.STRING_TRUE == unifiedCheckoutFlag){
        if(Constants.STRING_TRUE ==  PayerAuthenticationFlag  ){
            shippingAddress.value = cartObject.shippingAddress;
            console.log("line 157");
            updatedCart =  await updateCartShippingAddress(shippingAddress.value);
            me.value.activeCart = updatedCart;
        } else {
          console.log("line 161");
          updatedCart =  await updateCartShippingAddress(billingAddress.value);
          me.value.activeCart = updatedCart;
        }
      } else {
        console.log("line 166");
        updatedCart =  await updateCartShippingAddress(billingAddress.value);
        me.value.activeCart = updatedCart;
      }
      }
      else{
        console.log("line 172");
        updatedCart = await updateCartShippingAddress(shippingAddress.value);
        me.value.activeCart = updatedCart;
      }
      console.log("place order called",paymentid,paymentid.value)
      if (paymentid.value) {
        orderNumber.value = paymentid.value;
        orderDate.value = me.value.activeCart.createdAt;
        await addPaymentToCart(paymentid.value);
      }

      await completeOrderActions(updatedCart, actions,paymentid);
    };

    const updateCartBillingAddress = async (address) => {
      const result = await updateMyCart([
        { setBillingAddress: { address } }
      ],me.value.activeCart);
      return result?.data?.updateMyCart;
    };

    const updateCartShippingAddress = async (address) => {
      console.log("cart pagecheckout",me.value.activeCart)
      const result = await updateMyCart([
        { setShippingAddress: { address } }
      ],me.value.activeCart);
      return result.data.updateMyCart;
    };

    const addPaymentToCart = async (paymentid) => {
      const result = await updateMyCart([
        { addPayment: { payment: { id: paymentid } } }
      ],me.value.activeCart);
      orderNumber.value = paymentid;
      orderDate.value = me.value.activeCart.createdAt;
      return result.data.updateMyCart;
    };

    const completeOrderActions = async (result, actions,paymentid) => {
      const updatedResult = await new Promise((resolve) => {
        if (actions?.beforeCompleteAsync) {
          actions.beforeCompleteAsync(result,paymentid.value).then(resolve);
        } else {
          resolve(result);
        }
      });

      me.value.activeCart = updatedResult;
      await createMyOrder(me.value.activeCart);
      orderComplete.value = true;
      if (actions?.afterComplete) {
        actions.afterComplete();
      }
    };
    watch([cart, loading], ([cart, loading]) => {
      if (!cart && !loading) {
        // router.replace({ path: '/' });
      }
    });
    const setValidBillingForm = (valid) => {
      validBillingForm.value = valid;
    };
    const setValidShippingForm = (valid) => {
      validShippingForm.value = valid;
    };
    const updateBilling = (billingDetails) => {
      billingAddress.value = JSON.parse(
        JSON.stringify(billingDetails)
      );
    };
    const updateShipping = (shippingDetails) => {
      shippingAddress.value = JSON.parse(
        JSON.stringify(shippingDetails)
      );
    };
    const updateShippingMethod = (shippingId) => {
      shippingMethod.value = shippingId;
    };
    const paymentChanged = (payment) => {
      paymentMethod.value = payment;
    };
  
    return {
      ...cartTools,
      placeOrder,
      shippingMethod,
      billingAddress,
      shippingAddress,
      validBillingForm,
      validShippingForm,
      showError,
      setValidBillingForm,
      setValidShippingForm,
      updateBilling,
      updateShipping,
      updateShippingMethod,
      paymentMethod,
      paymentChanged,
      error,
      cart,
      t,
      orderComplete,
      orderDate,
      orderNumber
    };
  },
};
