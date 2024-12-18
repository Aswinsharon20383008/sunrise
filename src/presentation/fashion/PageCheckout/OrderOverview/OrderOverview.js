// import gql from "graphql-tag";
// import VuePerfectScrollbar from "vue-perfect-scrollbar";
// import ShippingMethod from "../ShippingMethod/ShippingMethod.vue";
// import PaymentMethod from "../PaymentMethod/index";
// import BasePrice from "../../components/BasePrice/BasePrice.vue";
import productMixin from "../../../../mixins/productMixin";
import cartMixin from "../../../../mixins/cartMixin";
import CartLikePriceDetail from "../../components/common/CartLike/CartLikePriceDetail/CartLikePriceDetail.vue";
import LineItemInfo from "../../components/common/CartLike/LineItemInfo/LineItemInfo.vue";
// import CART_FRAGMENT from "../../Cart.gql";
// import MONEY_FRAGMENT from "../../Money.gql";
// import ADDRESS_FRAGMENT from "../../Address.gql";
// import {
//   locale
// } from "../../components/common/shared";
// console.log('components', JSON.stringify(PaymentMethod));
// export default {
//   props: {
//     showError: {
//       type: Boolean,
//       required: false,
//     },
//     cart: {
//       type: Object,
//       required: true,
//     },
//     paymentMethod: {
//       type: String,
//       required: true,
//     },
//   },
//   components: {
//     LineItemInfo,
//     ShippingMethod,
//     PaymentMethod,
//     CartLikePriceDetail,
//     BasePrice,
//     VuePerfectScrollbar,
//   },
//   mixins: [productMixin, cartMixin],
//   data: () => ({
//     me: null,
//     paid: false,
//     paymentid: null,
//   }),
//   methods: {
//     cardPaid(paymentid, actions) {
//       if (paymentid) {
//         this.paymentid = paymentid;
//         if (process.env.VUE_APP_USE_ISV_PAYMENT) {
//           this.$emit("complete-order", this.paymentid, actions);
//         } else {
//           this.paid = true;
//         }
//       }
//     },
//     totalPrice,
//     updateShippingMethod(shippingId) {
//       this.$emit("update-shipping", shippingId);
//       this.$apollo.queries.me.refresh();
//     },
//     placeOrder() {
//       if (!process.env.VUE_APP_USE_ISV_PAYMENT) {
//         this.$emit("complete-order", this.paymentid);
//       }
//     },
//     nameFromLineItem(lineItem) {
//       const attributes = variantAttributes(
//         lineItem?.variant,
//         locale(this)
//       );
//       return `${lineItem.name} ${attributes
//         .map(({ name, value }) => `${name}: ${value}`)
//         .join(", ")}`;
//     },
//   },
//   computed: {
//     subtotal() {
//       if (this.me) {
//         return subTotal(this.me.activeCart);
//       }
//       return null;
//     },
//     amount() {
//       return this.me.activeCart.totalPrice;
//     },
//   },
//   apollo: {
//     me: {
//       query: gql`
//         query me($locale: Locale!) {
//           me {
//             activeCart {
//               ...CartFields
//             }
//           }
//         }
//         ${CART_FRAGMENT}
//         ${MONEY_FRAGMENT}
//         ${ADDRESS_FRAGMENT}
//       `,
//       variables() {
//         return {
//           locale: locale(this),
//         };
//       },
//       skip() {
//         return !locale(this);
//       },
//     },
//   },
// };

// @todo: add scrollbar
import gql from "graphql-tag";
import PaymentMethod from '../PaymentMethod/index';
import BasePrice from 'presentation/components/BasePrice/BasePrice.vue';
import { useI18n } from 'vue-i18n';
import ShippingMethod from '../ShippingMethod/ShippingMethod.vue';
import { ref, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  totalPrice,
  locale,
  subTotal,
  variantAttributes,
} from "../../components/common/shared";
import CART_FRAGMENT from "../../Cart.gql";
import MONEY_FRAGMENT from "../../Money.gql";
import ADDRESS_FRAGMENT from "../../Address.gql";

// export default {
//   props: {
//     showError: {
//       type: Boolean,
//       required: false,
//     },
//     cart: {
//       type: Object,
//       required: true,
//     },
//     paymentMethod: {
//       type: String,
//       required: true,
//     },
//   },
//   components: {
//     LineItemInfo,
//     ShippingMethod,
//     PaymentMethod,
//     CartLikePriceDetail,
//     BasePrice,
//     // VuePerfectScrollbar,
//   },
//   mixins: [productMixin, cartMixin],
//   data: () => ({
//     me: null,
//     paid: false,
//     paymentid: null,
//   }),
//   setup(props, { emit }) {
//     const { t } = useI18n();
//     const paid = ref(false);
//     const paymentId = ref(null);
//     const cardPaid = (paymentId) => {
//       if (paymentId) {
//         paymentId.value = paymentId;
//       }
//       paid.value = true;
//     };
//     console.log('cardPaid', cardPaid())
//     const updateShippingMethod = (shippingId) => {
//       emit('update-shipping', shippingId);
//     };
//     const placeOrder = () => {
//       emit('complete-order', paymentId);
//     };
//     const paymentChanged = (value) =>
//       emit('payment-changed', value);
//     return {
//       ...useCartTools(),
//       t,
//       cardPaid,
//       updateShippingMethod,
//       paymentId,
//       paid,
//       paymentMethod: props.paymentMethod,
//       paymentChanged,
//       placeOrder
//     };
//   },
// };

export default {
  props: {
    showError: {
      type: Boolean,
      required: false,
    },
    cart: {
      type: Object,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
  },
  components: {
    LineItemInfo,
    ShippingMethod,
    PaymentMethod,
    CartLikePriceDetail,
    BasePrice,
  },
  mixins: [productMixin, cartMixin],

  setup(props, { emit }) {
    const { t } = useI18n();  // Use the i18n plugin for translations

    // Reactive variables using `ref`
    const me = ref(null);
    const paid = ref(false);  // Payment status
    const paymentId = ref(null);  // Payment ID  // Handle errors if needed

    // Method to handle payment completion
    const cardPaid = (newPaymentId, actions) => {
      if (newPaymentId) {
        paymentId.value = newPaymentId;  // Set reactive paymentId
      }
      if (process.env.VUE_APP_USE_ISV_PAYMENT) {
        emit("complete-order", paymentId, actions);
      } else {
        paid.value = true;
      }
      paid.value = true;  // Mark the payment as completed
    };

    const { result: meResult } = useQuery(gql`
      query me($locale: Locale!) {
        me {
          activeCart {
            ...CartFields
          }
        }
      }
      ${CART_FRAGMENT}
      ${MONEY_FRAGMENT}
      ${ADDRESS_FRAGMENT}
    `, {
      locale: locale(props),
    });

    // Update me with the Apollo result
    me.value = meResult.value?.me;
    // Emit event to update shipping method
    const updateShippingMethod = (shippingId) => {
      emit('update-shipping', shippingId);  // Emit to parent
      meResult.refetch();
    };

    // Emit event to complete order
    const placeOrder = () => {
      if (!process.env.VUE_APP_USE_ISV_PAYMENT) {
        let paymentId =  paymentId.value;
        emit("complete-order",paymentId );
      }
    };
    const nameFromLineItem = (lineItem) => {
      const attributes = variantAttributes(lineItem?.variant, locale(props));
      return `${lineItem.name} ${attributes.map(({ name, value }) => `${name}: ${value}`).join(", ")}`;
    };
    // Emit event when payment method changes
    const paymentChanged = (value) => {
      emit('payment-changed', value);  // Notify parent of payment method change
    };

    const subtotal = computed(() =>
      me.value ? subTotal(me.value.activeCart) : null);
    console.log("line 280",subtotal)
    const sortedLineItems = computed(() => {
      return me.value?.activeCart?.lineItems || [];
    });

    const amount = computed(() => me.value?.activeCart?.totalPrice);


    // Return reactive properties and methods to the template
    return {
      t,
      cardPaid,
      updateShippingMethod,
      paymentId,
      paid,
      paymentMethod: props.paymentMethod,  // Use prop in template
      paymentChanged,
      placeOrder,
      nameFromLineItem,
      locale,
      variantAttributes,
      amount,
      totalPrice,
      subtotal,
      sortedLineItems
    };
  },
};


// import { ref, computed } from 'vue';
// import { useQuery } from '@vue/apollo-composable';
// import { subTotal, totalPrice, locale, variantAttributes } from '../../common/shared';
// import CART_FRAGMENT from '../../Cart.gql';
// import MONEY_FRAGMENT from '../../Money.gql';
// import ADDRESS_FRAGMENT from '../../Address.gql';

// export default {
//   setup(props, { emit }) {
//     const me = ref(null);
//     const paid = ref(false);
//     const paymentId = ref(null);

//     const cardPaid = (paymentId, actions) => {
//       if (paymentId) {
//         paymentId.value = paymentId;
//         if (process.env.VUE_APP_USE_ISV_PAYMENT) {
//           emit('complete-order', paymentId.value, actions);
//         } else {
//           paid.value = true;
//         }
//       }
//     };

//     const { result: meQuery, loading, error } = useQuery(gql`
//       query me($locale: Locale!) {
//         me {
//           activeCart {
//             ...CartFields
//           }
//         }
//       }
//       ${CART_FRAGMENT}
//       ${MONEY_FRAGMENT}
//       ${ADDRESS_FRAGMENT}
//     `, { locale: locale(props) });

//     const subtotal = computed(() => meQuery.value ? subTotal(meQuery.value.activeCart) : null);
//     const amount = computed(() => meQuery.value ? meQuery.value.activeCart.totalPrice : null);

//     const updateShippingMethod = (shippingId) => {
//       emit('update-shipping', shippingId);
//     };

//     const placeOrder = () => {
//       emit('complete-order', paymentId.value);
//     };

//     return {
//       meQuery,
//       subtotal,
//       amount,
//       cardPaid,
//       updateShippingMethod,
//       placeOrder,
//       paid,
//       paymentId,
//     };
//   }
// };