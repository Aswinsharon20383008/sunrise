import { gql } from '@apollo/client/core';
import { apolloClient } from '../../../../../../apollo/index';

const CART_QUERY = gql`
  query myCart($locale: Locale!) {
    myCart: me {
      activeCart {
        cartId: id
        version
        lineItems {
          lineId: id
          name(locale: $locale)
          productSlug(locale: $locale)
          quantity
          price {
            value {
              centAmount
              currencyCode
              fractionDigits
            }
            discounted {
              value {
                centAmount
                currencyCode
                fractionDigits
              }
              discount {
                name(locale: $locale)
              }
            }
          }
          totalPrice {
            centAmount
            currencyCode
            fractionDigits
          }
          variant {
            sku
            images {
              url
            }
            attributesRaw {
              name
              value
              attributeDefinition {
                type {
                  name
                }
                name
                label(locale: $locale)
              }
            }
          }
        }
        totalPrice {
          centAmount
          currencyCode
          fractionDigits
        }
        shippingInfo {
          shippingMethod {
            methodId: id
            name
            localizedDescription(locale: $locale)
          }
          price {
            centAmount
            currencyCode
            fractionDigits
          }
        }
        taxedPrice {
          totalGross {
            centAmount
            currencyCode
            fractionDigits
          }
          totalNet {
            centAmount
            currencyCode
            fractionDigits
          }
        }
        discountCodes {
          discountCode {
            codeId: id
            code
            name(locale: $locale)
          }
        }
        shippingAddress {
          firstName
          lastName
          streetName
          additionalStreetInfo
          postalCode
          city
          country
          phone
          email
        }
        billingAddress {
          firstName
          lastName
          streetName
          additionalStreetInfo
          postalCode
          city
          country
          phone
          email
        }
      }
    }
  }
`;

export const fetchCartData = async (locale) => {
    try {
        const response = await apolloClient.query({
            query: CART_QUERY,
            variables: { locale },
        });
        return response.data.myCart.activeCart;
    } catch (error) {
        console.error('Error fetching cart:', error);
        return null;
    }
};