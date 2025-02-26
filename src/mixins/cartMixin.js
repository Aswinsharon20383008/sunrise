import { ref, computed } from 'vue';
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
import { useStore } from 'vuex'
// import store from '../store';




export default {
  setup() {
    const me = ref({});
    const { cart } = useCart();
    // const apolloClient = useApolloClient(); // Apollo client instance// User data (me object)
    me.value.activeCart = cart.value;
    const { locale } = useLocale();
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

    const updateMyCart = async (actions, activeCart) => {
      try {
        if (activeCart && (cart.value.version < activeCart?.version)) {
          cart.value = activeCart;
          me.value.activeCart = activeCart;
        }
        if (!cart && !activeCart) {
          me.value.activeCart = store.state.activeCart;
        }
        let cartapi = await cartApi.getCart(me.value.activeCart?.cartId || me.value.activeCart?.id);
        if (cartapi.version > cart.value.version) {
          cart.value = cartapi;
        }
        if (store.state.activeCart.version > cart.value.version) {
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
            id: cart.value?.id || cart.value?.cartId,
            version: cart.value.version,
            locale: locale.value,
          },
        });
        cart.value = result.data.updateMyCart;
        store.dispatch('setActiveCart', result)
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
        if (activeCart && (cart.value.version != activeCart?.version)) {
          cart.value = activeCart;
        }
        if (!cart.value && !activeCart) {
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
            id: cart.value?.id || cart.value?.cartId,
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
            store.writeQuery({ query: BASIC_CART_QUERY, data: newData });

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
