// import gql from 'graphql-tag';
// import BASIC_CART_QUERY from './BasicCart.gql';
// import CART_FRAGMENT from '../presentation/fashion/Cart.gql';
// import ORDER_FRAGMENT from '../presentation/fashion/Order.gql';
// import MONEY_FRAGMENT from '../presentation/fashion/Money.gql';
// import ADDRESS_FRAGMENT from '../presentation/fashion/Address.gql';
// import { locale } from '../presentation/fashion/components/common/shared';

// function cartExists(vm) {
//   return vm.me?.activeCart;
// }

// export default {
//   computed: {
//     cartExists() {
//       return cartExists(this);
//     },

//     cartNotEmpty() {
//       return this.me?.activeCart?.lineItems.length > 0;
//     },

//     totalItems() {
//       if (cartExists(this)) {
//         return this.me.activeCart.lineItems.reduce((acc, li) => acc + li.quantity, 0);
//       }
//       return 0;
//     },

//     sortedLineItems() {
//       if (cartExists(this)) {
//         return [...this.me.activeCart.lineItems].reverse();
//       }
//       return [];
//     },
//   },

//   methods: {
//     updateMyCart(actions) {
//       // Issue with under-fetching on mutations https://github.com/apollographql/apollo-client/issues/3267
//       // required any queried field to be fetched in order to update all components using carts, e.g. mini-cart
//       return this.$apollo.mutate({
//         mutation: gql`
//           mutation updateMyCart($id: String!, $version: Long!, $actions: [MyCartUpdateAction!]!, $locale: Locale!) {
//             updateMyCart(id: $id, version: $version, actions: $actions) {
//               ...CartFields
//             }
//           }
//           ${CART_FRAGMENT}
//           ${MONEY_FRAGMENT}
//           ${ADDRESS_FRAGMENT}`,
//         variables: {
//           actions,
//           id: this.me.activeCart?.id,
//           version: this.me.activeCart?.version,
//           locale: locale(this),
//         },
//       }).then(
//         (result) => {
//           if (!result?.data?.updateMyCart?.lineItems?.length) {
//             return this.$apollo.mutate({
//               mutation: gql`
//                 mutation deleteMyCart($id: String!, $version: Long!) {
//                   deleteMyCart(id: $id, version: $version) {
//                     id
//                   }
//                 }`,
//               variables: {
//                 id: result.data.updateMyCart.id,
//                 version: result.data.updateMyCart.version,
//               },
//             }).then(
//               () => window.location.reload(),
//             );
//           }
//           return result;
//         },
//       );
//     },

//     createMyCart(draft) {
//       const inventoryMode = process.env.VUE_APP_INVENTORY_MODE;
//       if (inventoryMode) {
//         // eslint-disable-next-line no-param-reassign
//         draft = { ...draft, inventoryMode };
//       }
//       return this.$apollo.mutate({
//         mutation: gql`
//           mutation ($draft: MyCartDraft!, $withInventory: Boolean!) {
//             createMyCart(draft: $draft) {
//               id
//               version
//               inventoryMode @include(if: $withInventory)
//             }
//           }`,
//         variables: { draft, withInventory: Boolean(inventoryMode) },
//         update: (store, { data: { createMyCart } }) => {
//           const data = store.readQuery({ query: BASIC_CART_QUERY });
//           data.me.activeCart = createMyCart;
//           store.writeQuery({ query: BASIC_CART_QUERY, data });
//         },
//       });
//     },

//     createMyOrder() {
//       return this.$apollo.mutate({
//         mutation: gql`
//           mutation ($id: String!, $version: Long!, $locale: Locale!) {
//             createMyOrderFromCart(draft: { id: $id, version: $version }) {
//               ...OrderFields
//             }
//           }
//           ${ORDER_FRAGMENT}
//           ${MONEY_FRAGMENT}
//           ${ADDRESS_FRAGMENT}`,
//         variables: {
//           id: this.me.activeCart?.id,
//           version: this.me.activeCart?.version,
//           locale: locale(this),
//         },
//         update: (store) => {
//           const data = store.readQuery({ query: BASIC_CART_QUERY });
//           data.me.activeCart = null;
//           store.writeQuery({ query: BASIC_CART_QUERY, data });
//           // invalidate cached order pages
//           Object.keys(store.data.toObject())
//             .filter((key) => key.toLowerCase().includes('order'))
//             .forEach(
//               (key) => store.data.delete(key),
//             );
//           //optionally invalidate product queries
//           //  inventory has changed
//           if (process.env.VUE_APP_INVENTORY_MODE) {
//             Object.keys(store.data.toObject())
//               .filter((key) => key.toLowerCase().includes('product'))
//               .forEach(
//                 (key) => store.data.delete(key),
//               );
//           }
//         },
//       });
//     },
//   },

//   apollo: {
//     me: BASIC_CART_QUERY,
//   },
// };
// import { useMutation } from '@vue/apollo-composable';
// import gql from 'graphql-tag';
// import CART_FRAGMENT from '../presentation/fashion/Cart.gql';
// import MONEY_FRAGMENT from '../presentation/fashion/Money.gql';
// import ADDRESS_FRAGMENT from '../presentation/fashion/Address.gql';
// import { locale } from '../presentation/fashion/components/common/shared';

// export function cartMixin() {
//   const cartExists = (me) => {
//     return me?.activeCart;
//   };

//   // Method for updating the cart
//   const updateMyCart = (actions, activeCart) => {
//     return useMutation(gql`
//       mutation updateMyCart($id: String!, $version: Long!, $actions: [MyCartUpdateAction!]!, $locale: Locale!) {
//         updateMyCart(id: $id, version: $version, actions: $actions) {
//           ...CartFields
//         }
//       }
//       ${CART_FRAGMENT}
//       ${MONEY_FRAGMENT}
//       ${ADDRESS_FRAGMENT}`,
//       {
//         actions,
//         id: activeCart?.id,
//         version: activeCart?.version,
//         locale: locale(),
//       }
//     );
//   };

//   // Method for creating a new cart
//   const createMyCart = (draft) => {
//     const inventoryMode = process.env.VUE_APP_INVENTORY_MODE;
//     if (inventoryMode) {
//       draft = { ...draft, inventoryMode };
//     }
//     return useMutation(gql`
//       mutation ($draft: MyCartDraft!, $withInventory: Boolean!) {
//         createMyCart(draft: $draft) {
//           id
//           version
//           inventoryMode @include(if: $withInventory)
//         }
//       }`,
//       { draft, withInventory: Boolean(inventoryMode) }
//     );
//   };

//   // Method for creating an order from cart
//   const createMyOrder = (activeCart) => {
//     return useMutation(gql`
//       mutation ($id: String!, $version: Long!, $locale: Locale!) {
//         createMyOrderFromCart(draft: { id: $id, version: $version }) {
//           ...OrderFields
//         }
//       }
//       ${CART_FRAGMENT}
//       ${MONEY_FRAGMENT}
//       ${ADDRESS_FRAGMENT}`,
//       {
//         id: activeCart?.id,
//         version: activeCart?.version,
//         locale: locale(),
//       }
//     );
//   };

//   return { cartExists, updateMyCart, createMyCart, createMyOrder };
// }

//TODO:remove WORKING code
// import gql from 'graphql-tag';
// import BASIC_CART_QUERY from './BasicCart.gql';
// import CART_FRAGMENT from '../presentation/fashion/Cart.gql';
// import ORDER_FRAGMENT from '../presentation/fashion/Order.gql';
// import MONEY_FRAGMENT from '../presentation/fashion/Money.gql';
// import ADDRESS_FRAGMENT from '../presentation/fashion/Address.gql';
// // import { locale } from '../presentation/fashion/components/common/shared';
// import { apolloClient} from '../apollo';

// function cartExists(vm) {
//   return vm.me?.activeCart;
// }

// export default {
//   computed: {
//     cartExists() {
//       return cartExists(this);
//     },

//     cartNotEmpty() {
//       return this.me?.activeCart?.lineItems.length > 0;
//     },

//     totalItems() {
//       if (cartExists(this)) {
//         return this.me.activeCart.lineItems.reduce((acc, li) => acc + li.quantity, 0);
//       }
//       return 0;
//     },

//     sortedLineItems() {
//       if (cartExists(this)) {
//         return [...this.me.activeCart.lineItems].reverse();
//       }
//       return [];
//     },
//   },

//   methods: {

//     updateMyCart(actions,cart) {
//       // Issue with under-fetching on mutations https://github.com/apollographql/apollo-client/issues/3267
//       // required any queried field to be fetched in order to update all components using carts, e.g. mini-cart
//       console.log("activecart",cart)

//       return apolloClient.mutate({
//         mutation: gql`
//           mutation updateMyCart($id: String!, $version: Long!, $actions: [MyCartUpdateAction!]!, $locale: Locale!) {
//             updateMyCart(id: $id, version: $version, actions: $actions) {
//               ...CartFields
//             }
//           }
//           ${CART_FRAGMENT}
//           ${MONEY_FRAGMENT}
//           ${ADDRESS_FRAGMENT}`,
//         variables: {
//           actions,
//           id: cart?.id || cart?.cartId,
//           version: cart?.version,
//           locale: 'en',//todo:remove get uselocale change to vue3
//         },
//       }).then(
//         (result) => {
//           if (!result?.data?.updateMyCart?.lineItems?.length) {
//             // return this.$apollo.mutate({
//             return apolloClient.mutate({
//               mutation: gql`
//                 mutation deleteMyCart($id: String!, $version: Long!) {
//                   deleteMyCart(id: $id, version: $version) {
//                     id
//                   }
//                 }`,
//               variables: {
//                 id: result.data.updateMyCart.id,
//                 version: result.data.updateMyCart.version,
//               },
//             }).then(
//               () => window.location.reload(),
//             );
//           }
//           return result;
//         },
//       );
//     },

//     createMyCart(draft) {
//       const inventoryMode = process.env.VUE_APP_INVENTORY_MODE;
//       if(inventoryMode){
//         // eslint-disable-next-line no-param-reassign
//         draft = { ...draft, inventoryMode };
//       }
//       // return this.$apollo.mutate({
//         return apolloClient.mutate({
//         mutation: gql`
//           mutation ($draft: MyCartDraft!, $withInventory: Boolean!) {
//             createMyCart(draft: $draft) {
//               id
//               version
//               inventoryMode @include(if: $withInventory)
//             }
//           }`,
//         variables: { draft, withInventory: Boolean(inventoryMode) },
//         update: (store, { data: { createMyCart } }) => {
//           const data = store.readQuery({ query: BASIC_CART_QUERY });
//           data.me.activeCart = createMyCart;
//           store.writeQuery({ query: BASIC_CART_QUERY, data });
//         },
//       });
//     },

//     createMyOrder(me) {
//       return apolloClient.mutate({
//         mutation: gql`
//           mutation ($id: String!, $version: Long!, $locale: Locale!) {
//             createMyOrderFromCart(draft: { id: $id, version: $version }) {
//               ...OrderFields
//             }
//           }
//           ${ORDER_FRAGMENT}
//           ${MONEY_FRAGMENT}
//           ${ADDRESS_FRAGMENT}`,
//         variables: {
//           id: me?.id,
//           version: me?.version,
//           locale: 'en',//todo:remove get uselocale change to vue3
//         },
//         update: (store) => {
//           const data = store.readQuery({ query: BASIC_CART_QUERY });
//           // data.me.activeCart = null;
//           const newData = {
//             ...data,
//             me: {
//               ...data.me,
//               activeCart: null, // Set activeCart to null
//             }
//           };
//           store.writeQuery({ query: BASIC_CART_QUERY, data:newData });
//           // invalidate cached order pages
//           Object.keys(store.data.toObject())
//             .filter((key) => key.toLowerCase().includes('order'))
//             .forEach(
//               (key) => store.data.delete(key),
//             );
//           //optionally invalidate product queries
//           //  inventory has changed
//           if(process.env.VUE_APP_INVENTORY_MODE){
//             Object.keys(store.data.toObject())
//             .filter((key) => key.toLowerCase().includes('product'))
//             .forEach(
//               (key) => store.data.delete(key),
//             );
//           }
//         },
//       });
//     },
//   },

//   apollo: {
//     me: BASIC_CART_QUERY,
//   },
// };

import { ref ,computed} from 'vue';
import gql from 'graphql-tag';
import BASIC_CART_QUERY from './BasicCart.gql';
import CART_FRAGMENT from '../presentation/fashion/Cart.gql';
import ORDER_FRAGMENT from '../presentation/fashion/Order.gql';
import MONEY_FRAGMENT from '../presentation/fashion/Money.gql';
import ADDRESS_FRAGMENT from '../presentation/fashion/Address.gql';
import useLocale from 'hooks/useLocale';
import { apolloClient } from '../apollo';
import useCart from 'hooks/useCart';
import cartApi from '../presentation/fashion/PageCheckout/PaymentMethod/IsvPayment/api/cart';
import {useStore} from 'vuex'
// import store from '../store';




export default {
  setup() {
    const me = ref({});
    const { cart } = useCart();
    // const apolloClient = useApolloClient(); // Apollo client instance// User data (me object)
    me.value.activeCart = cart.value;
    const {locale} = useLocale();
    const store = useStore();
// Reactive cart object
    const inventoryMode = process.env.VUE_APP_INVENTORY_MODE;
 
    const cartExists = computed(() => cart.value !== null); // Check if cart exists
    const cartNotEmpty = computed(() => cartExists.value && cart.value.lineItems.length > 0); // Check if cart is not empty

    const totalItems = computed(() => {
      if (cartExists.value) {
        return cart.value.lineItems.reduce((acc, li) => acc + li.quantity, 0);
      }
      return 0;
    });

    const sortedLineItems = computed(() => {
      if (cartExists.value) {
        return [...cart.value.lineItems].reverse();
      }
      return [];
    });

    const updateMyCart = async (actions,activeCart) => {
      try {
        if(activeCart && (cart.value.version < activeCart?.version)){
          cart.value = activeCart;
          me.value.activeCart = activeCart;
        }
        if(!cart && !activeCart){
          me.value.activeCart = store.state.activeCart;
        } 
        let cartapi = await cartApi.getCart(me.value.activeCart?.cartId || me.value.activeCart?.id);
        if(cartapi.version > cart.value.version){
          cart.value = cartapi;
        }
        if(store.state.activeCart.version > cart.value.version){
          cart.value = store.state.activeCart;
        }
        const result = await apolloClient.mutate({
          mutation: gql`
            mutation updateMyCart($id: String!, $version: Long!, $actions: [MyCartUpdateAction!]!, $locale: Locale!) {
              updateMyCart(id: $id, version: $version, actions: $actions) {
                ...CartFields
              }
            }
            ${CART_FRAGMENT}
            ${MONEY_FRAGMENT}
            ${ADDRESS_FRAGMENT}
          `,
          variables: {
            actions,
            id: cart.value?.id ||cart.value?.cartId ,
            version: cart.value.version,
            locale: locale.value,
          },
        });
        cart.value = result.data.updateMyCart;
        store.dispatch('setActiveCart',result)
        if (!result?.data?.updateMyCart?.lineItems?.length) {
          await apolloClient.mutate({
            mutation: gql`
              mutation deleteMyCart($id: String!, $version: Long!) {
                deleteMyCart(id: $id, version: $version) {
                  id
                }
              }
            `,
            variables: {
              id: result.data.updateMyCart.id,
              version: result.data.updateMyCart.version,
            },
          });

          window.location.reload();
        }

        return result;
      } catch (error) {
        console.error("Error updating cart cart mixin:", error);
      }
    };

    const createMyCart = async (draft) => {
      try {
        if (inventoryMode) {
          draft = { ...draft, inventoryMode };
        }

        const result = await apolloClient.mutate({
          mutation: gql`
            mutation ($draft: MyCartDraft!, $withInventory: Boolean!) {
              createMyCart(draft: $draft) {
                id
                version
                inventoryMode @include(if: $withInventory)
              }
            }
          `,
          variables: { draft, withInventory: Boolean(inventoryMode) },
          update: (store, { data: { createMyCart } }) => {
            const data = store.readQuery({ query: BASIC_CART_QUERY });
            data.me.activeCart = createMyCart;
            store.writeQuery({ query: BASIC_CART_QUERY, data });
          },
        });

        return result;
      } catch (error) {
        console.error("Error creating cart:", error);
      }
    };

    const createMyOrder = async (activeCart) => {
      try {
        if(activeCart && (cart.value.version != activeCart?.version)){
          cart.value = activeCart;
        }
        if(!cart.value && !activeCart){
          me.value.activeCart = store.state.activeCart;
        }
        const result = await apolloClient.mutate({
          mutation: gql`
            mutation ($id: String!, $version: Long!, $locale: Locale!) {
              createMyOrderFromCart(draft: { id: $id, version: $version }) {
                ...OrderFields
              }
            }
            ${ORDER_FRAGMENT}
            ${MONEY_FRAGMENT}
            ${ADDRESS_FRAGMENT}
          `,
          variables: {
            id: cart.value?.id ||cart.value?.cartId ,
            version: cart.value?.version,
            locale: locale.value,
          },
          update: (store) => {
            const data = store.readQuery({ query: BASIC_CART_QUERY });
            // data.me.activeCart = null;
            const newData = {
                          ...data,
                          me: {
                            ...data.me,
                            activeCart: null, // Set activeCart to null
                          }
                        };
            store.writeQuery({ query: BASIC_CART_QUERY, data:newData });

            // Invalidate cached order pages
            Object.keys(store.data.toObject())
              .filter((key) => key.toLowerCase().includes('order'))
              .forEach((key) => store.data.delete(key));

            // Optionally invalidate product queries if inventory mode is on
            if (inventoryMode) {
              Object.keys(store.data.toObject())
                .filter((key) => key.toLowerCase().includes('product'))
                .forEach((key) => store.data.delete(key));
            }
          },
        });

        return result;
      } catch (error) {
        console.error("Error creating order:", error);
      }
    };

    return {
      cartExists,
      cartNotEmpty,
      totalItems,
      sortedLineItems,
      updateMyCart,
      createMyCart,
      createMyOrder,
    };
  }
};


