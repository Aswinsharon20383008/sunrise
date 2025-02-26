
// /* eslint-disable no-console */
import { defineComponent, ref, watch, computed } from 'vue';
import { required } from 'vuelidate/lib/validators';
import cartApi from "../PaymentMethod/IsvPayment/api/cart";
import shippingApi from "../PaymentMethod/IsvPayment/api/shipping";
import { Constants } from '../PaymentMethod/IsvPayment/Constants';
import BaseRadio from '../../components/common/form/BaseRadio/BaseRadio.vue';
import BaseMoney from '../../../fashion/components/BaseMoney/BaseMoney.vue';
import BaseForm from '../../components/common/form/BaseForm/BaseForm.vue';
import BaseLabel from '../../components/common/form/BaseLabel/BaseLabel.vue';
import ServerError from '../../components/common/form/ServerError/ServerError.vue';
import useCart from 'hooks/useCart';
import useShippingMethods from 'hooks/useShippingMethods';
import cartMixin from '../../../../mixins/cartMixin';


// import {updateMyCart} from '../../../../mixins/cartMixin';
const multipleShipping = process.env.VUE_APP_ENABLE_MULTIPLE_SHIPPING;

var shippingAddress = [
  {
    shippingKey: "",
    shippingId: "", // no need to provide
    address: {
      key: "",
      streetName: "",
      streetNumber: "",
      postalCode: "",
      city: "",
      region: "",
      country: "",
      firstName: "",
      lastName: ""
    }
  }
];



export default defineComponent({
  components: {
    BaseLabel,
    ServerError,
    BaseForm,
    BaseMoney,
    BaseRadio,
  },
  setup() {
    const me = ref({});
    const selectedShippingMethod = ref(null);
    const {updateMyCart} = cartMixin.setup();
    const multipleShippingEnabled = ref(false);
    const shipping = ref({ id: null });
    const { cart } = useCart();
    me.value.activeCart = cart.value;
    const id = me.value.activeCart.cartId;
    const {shippingMethods} = useShippingMethods(id);
    const shippingMethodsByLocation = shippingMethods;
    console.log("spmthdloc",shippingMethods)
    
  //  me.value.activeCart.shippingAddress = shippingMethods.value;
  

    const updateItemShippingAddress = async () => {
      let itemShippingAddress;
      let updatedCart;
      let cartObj;
      let length = Constants.NUMBER_ZERO;
      cartObj = await cartApi.getCart(me.value.activeCart.cartId || me.value.activeCart.id);
      if (cartObj) {
        if (cartObj?.shipping) {
          length = cartObj?.shipping.length;
        }
      }
      if (length > 0) {
        itemShippingAddress = await setItemShippingAddress(length);
      }
      console.log("item shipping add",itemShippingAddress)
      updatedCart = await cartApi.addItemShippingAddress(itemShippingAddress);
      const lineItemShippingDetailsObj = await setMultipleLineItemShippingDetails();
      updatedCart = await cartApi.setLineItemShippingDetails(lineItemShippingDetailsObj);
      if (updatedCart?.errors) {
        console.log("ERROR", updatedCart.message);
      } else {
        me.value.activeCart = updatedCart;
        console.log("Multiple shipping added")
      }
    };

    const setItemShippingAddress = async (length) => {
      var cartObj = await cartApi.getCart(me.value.activeCart.cartId || me.value.activeCart.id);
      if (cartObj?.version > me.value.activeCart.version) {
        me.value.activeCart = cartObj;
      }
      var cartShippingDetails = cartObj.shipping;
      var itemShippingAddressObj = {
        id: me.value.activeCart.cartId || me.value.activeCart.id,
        version: '',
        updateActions: []
      };
      itemShippingAddressObj.version = me.value.activeCart.version;
      for (let i = 0; i < length; i++) {
        itemShippingAddressObj.updateActions.push({
          action: "addItemShippingAddress",
          address: {
            id: "exampleAddress",
            key: "exampleKey" + i,
            firstName: cartShippingDetails[i].shippingAddress.firstName,
            lastName: cartShippingDetails[i].shippingAddress.lastName,
            streetName: cartShippingDetails[i].shippingAddress.streetName,
            streetNumber: cartShippingDetails[i].shippingAddress.streetNumber,
            additionalStreetInfo: cartShippingDetails[i]?.shippingAddress?.additionalStreetInfo || '',
            postalCode: cartShippingDetails[i].shippingAddress.postalCode,
            city: cartShippingDetails[i].shippingAddress.city,
            region: cartShippingDetails[i].shippingAddress.region,
            country: cartShippingDetails[i].shippingAddress.country,
            phone: cartShippingDetails[i].shippingAddress.phone,
            email: cartShippingDetails[i].shippingAddress.email,
          }
        });
      }
      return itemShippingAddressObj;
    };

    const setMultipleLineItemShippingDetails = async () => {
      var lineItemShippingDetailsObj = {
        id: me.value.activeCart.cartId || me.value.activeCart.id,
        version: '',
        updateActions: []
      };
      var cartObj = await cartApi.getCart(me.value.activeCart.cartId || me.value.activeCart.id);
      if (cartObj.version > me.value.activeCart.version) {
        me.value.activeCart = cartObj;
      }
      var shippingLength = cartObj.shipping.length;
      lineItemShippingDetailsObj.version = me.value.activeCart.version;
      var lineItemQuantity = cartObj.lineItems.length;
      var lineItemsObjectQuantity;
      for (let i = 0; i < lineItemQuantity; i++) {
        lineItemsObjectQuantity = cartObj.lineItems[i].quantity;
        lineItemShippingDetailsObj.updateActions.push({
          action: "setLineItemShippingDetails",
          lineItemId: cartObj.lineItems[i].id,
          shippingDetails: {
            targets: []
          }
        });
        for (let j = 0; j < shippingLength; j++) {
          if ((j + 1) === shippingLength) {
            lineItemShippingDetailsObj.updateActions[i].shippingDetails.targets.push({
              addressKey: "exampleKey" + j,
              quantity: lineItemsObjectQuantity - j,
              shippingMethodKey: shippingAddress[j].shippingKey
            });
          } else {
            lineItemShippingDetailsObj.updateActions[i].shippingDetails.targets.push({
              addressKey: "exampleKey" + j,
              quantity: 1,
              shippingMethodKey: shippingAddress[j].shippingKey
            });
          }
        }
      }
      return lineItemShippingDetailsObj;
    };

    // const shippingMethodsByLocation = async (value) =>{
    //   if (!currentSelectedShippingMethod.value) {
    //     currentSelectedShippingMethod.value = value.find((shippingMethod) => shippingMethod.isDefault)?.id || value[0]?.id;
    //   }
    //   else {
    //     currentSelectedShippingMethod.value = undefined;
    //   }
    // }
    // const selectedShippingMethod = async() =>{
    //   if (!currentSelectedShippingMethod.value) {
    //     console.log("Not selected any shipping method");
    //     return
    //   }
    //   updateMyCart([
    //     {
    //       setShippingMethod: {
    //         shippingMethod: {
    //           typeId: 'shipping-method',
    //           id: currentSelectedShippingMethod.value,
    //         },
    //       },
    //     },
    //   ],me.value.activeCart);
       
    // }
  
    const updateShippingDetails = async () => {
      let cartObject;
      let cartNow;
      let object = await retriveShippingObject();
      console.log("line 253",object)
      cartNow = await cartApi.get(me.value.activeCart.cartId || me.value.activeCart.id);
      console.log("cartnow",cartNow)
      if (cartNow.version > me.value.activeCart.version) {
        me.value.activeCart = cartNow;
      }
      object.version = me.value.activeCart.version;
      cartObject = await cartApi.addShippingMethod(object);
      if (cartObject?.errors) {
        console.log("ERROR", cartObject.message);
      } else {
        me.value.activeCart = cartObject;
      }
    };

    const retriveShippingObject = async () => {
      let cartObj;
      let shippingMethodObj = {
        id: me.value.activeCart.cartId || me.value.activeCart.id,
        version: me.value.activeCart.version,
        updateActions: []
      };
      let shippingMethods = await shippingApi.queryShippingMethods();
      // eslint-disable-next-line no-unused-vars
      cartObj = await cartApi.getCart(me.value.activeCart.cartId || me.value.activeCart.id);
      shippingMethodObj.version = me.value.activeCart.version;
      let i = 0;
      shippingAddress.forEach(async (element) => {
        shippingMethodObj.updateActions.push({
          action: "addShippingMethod",
          shippingKey: element.shippingKey,
          shippingMethod: {
            id: shippingMethods.results[i].id,
            typeId: "shipping-method",
          },
          shippingAddress: {
            key: element.address.key,
            firstName: element.address.firstName,
            lastName: element.address.lastName,
            streetName: element.address.streetName,
            streetNumber: element.address.streetNumber,
            additionalStreetInfo: element?.additionalStreetInfo || '',
            postalCode: element.address.postalCode,
            city: element.address.city,
            region: element.address.region,
            country: element.address.country,
            email: element.address.email,
            phone: element.address.phone
          }
        });
        i++;
      });
      return shippingMethodObj;
    };

    const price = (shippingMethod) => {
      const shippingRate = matchingShippingRate(shippingMethod);
      return isFree(shippingRate) ? null : shippingRate.price;
    };

    const matchingShippingRate = (shippingMethod) => {
      return matchingZoneRate(shippingMethod).shippingRates
        .find((shippingRate) => shippingRate.isMatching);
    };

    const matchingZoneRate = (shippingMethod) => {
      return shippingMethod.zoneRates
        .find((zoneRate) => zoneRate.shippingRates
          .some((shippingRate) => shippingRate.isMatching));
    };

    const isFree = (shippingRate) => {
      const totalPrice = me.value.activeCart.totalPrice.centAmount;
      return totalPrice > shippingRate.freeAbove?.centAmount;
    };

    // const multipleShipping = ref(multipleShipping.value === "true");

    const selectedShippingMethodComputed = computed(() => selectedShippingMethod.value);
    // const refreshPage = () =>{
    //     location.reload();
    // }

    watch([multipleShipping,me], async () => {
      try {
        let updatedCart;
        let cart = await cartApi.getCart(me.value.activeCart?.cartId || me.value.activeCart?.id);
        if (multipleShipping == "true") {
          if (shipping.value?.id == null && cart.shipping.length === 0) {
            await updateShippingDetails();
            await updateItemShippingAddress();
            updatedCart = await cartApi.getCart(me.value.activeCart.cartId || me.value.activeCart?.id);
            me.value.activeCart = updatedCart;
            if (updatedCart.shipping.length > 0) {
              console.log("updatecart",updatedCart)
              shipping.value.id = updatedCart.shipping[0].shippingInfo.shippingMethod.id;
              multipleShippingEnabled.value = true;
            } else {
              multipleShippingEnabled.value = false;
            }
          } else {
            multipleShippingEnabled.value = true;
          }
        } else {
          multipleShippingEnabled.value = false;
        }
        if (cart.version > me.value.activeCart.version) {
          me.value.activeCart = cart;
        }
      } catch (exception) {
        console.log("Exception is : ", exception);
      }
    },{immediate:true});

    watch([shippingMethods,selectedShippingMethod], async()=>{
     if(!selectedShippingMethod.value){
      if(shippingMethods.value){
        selectedShippingMethod.value = shippingMethods.value.find((shippingMethod) => shippingMethod.isDefault)?.id || shippingMethods.value[0]?.methodId;
      }
      else {
        selectedShippingMethod.value = undefined;
      }
    }
    if(multipleShipping !== "true"){
    await  updateMyCart([
      {
        setShippingMethod: {
          shippingMethod: {
            typeId: 'shipping-method',
            id: selectedShippingMethod.value,
          },
        },
      },
    ]);
  }
    },{immediate:true})

    // watch(me.value, (newValue) => {
    //   selectedShippingMethod.value = newValue?.activeCart?.shippingInfo?.shippingMethod?.id;
    // },{immediate:true});
    
    // watch(shippingMethodsByLocation.value, (value) => {
    //   if (!selectedShippingMethod.value) {
    //     selectedShippingMethod.value = value.find((shippingMethod) => shippingMethod.isDefault)?.id || value[0]?.id;
    //   } else {
    //     selectedShippingMethod.value = undefined;
    //   }
    // },{immediate:true});
    
    // watch(selectedShippingMethod, async () => {
    //   if (!selectedShippingMethod.value) {
    //     console.log("Not selected any shipping method");
    //     return;
    //   }
    //   await updateMyCart([
    //     {
    //       setShippingMethod: {
    //         shippingMethod: {
    //           typeId: 'shipping-method',
    //           id: selectedShippingMethod.value,
    //         },
    //       },
    //     },
    //   ]);
    // },{immediate:true});


    return {
      me,
      selectedShippingMethod,
      shipping,
      multipleShippingEnabled,
      price,
      selectedShippingMethodComputed,
      shippingMethodsByLocation
    };
  },
  validations: {
    form: {
      shippingMethod: { required },
    },
  }
});
