<i18n src="./ShippingMethod.txt"></i18n>
<script src="./ShippingMethod.js"></script>

<template>
  <div class="payment-method">
    <div  id="multipleShippingElement" v-if="multipleShippingEnabled" 
    :key="shipping.methodId"
    >
      <label for="active" class="text-transform-camelcase">Multiple shipping methods Added</label>
    </div>
    <div >
      <div v-if = "!multipleShippingEnabled">
    <div
    
      v-for="shippingMethod in shippingMethodsByLocation"
      :key="shippingMethod.methodId"
      class="pay-top sin-payment"
    >
      <input
        class="input-radio"
        v-model="selectedShippingMethod"
        type="radio"
        :value="shippingMethod.methodId"
        name="shipping_method"
      />
      <label
        data-test="checkout-form-shipping-method-name"
      >
        <span class="col-md-10" style="padding: 0">
          {{ shippingMethod.name }}
        </span>
        <BaseMoney
          :money="price(shippingMethod)"
          data-test="checkout-form-shipping-method-price"
        />
      </label>
      <div class="payment-box payment_method_bacs">
        <p
          data-test="checkout-form-shipping-method-description"
        >
          {{ shippingMethod.localizedDescription }}
        </p>
      </div>
    </div>
  </div>
    </div>
  </div>
</template>
