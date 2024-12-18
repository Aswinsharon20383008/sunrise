<i18n src="./IsvPayment.txt"></i18n>
<style src="./IsvPayment.scss" lang="scss" scoped></style>
<script src="./IsvPayment.js"></script>
<template>
  <span>
    <div class="checkout-shipping-content">
      <div class="shipping-content-left">
        <span class="bold-text">Payment Method</span>
      </div>
    </div>
    <div class="payment-method">
      <div id="loading" v-if="loading"><span> Loading... </span></div>
      <div class="pay-top sin-payment">
        <input
          id="payment-method-3"
          v-model="PaymentMethods.showing"
          v-show="unifiedCheckout == 'false'"
          class="input-radio"
          type="radio"
          value="clickToPay"
          name="payment_method"
          data-test="clickToPay"
          @change="onPaymentMethodChange($event)"
        />
        <label for="payment-method-3" v-show="unifiedCheckout == 'false'"
          >Click to Pay</label
        >
        <div v-show="PaymentMethods.showing === 'clickToPay'">
          <img
            :src="visaButtonUrl"
            alt="Click to Pay"
            class="v-button"
            role="button"
            data-test="visa-button"
          />
        </div>

        <input
          id="payment-method-4"
          v-model="PaymentMethods.showing"
          v-show="unifiedCheckout == 'false'"
          class="input-radio"
          type="radio"
          value="flexMicroform"
          name="payment_method"
          data-test="flexform"
          @change="onPaymentMethodChange($event)"
        />
        <label for="payment-method-4" v-show="unifiedCheckout == 'false'"
          >Credit Card</label
        >
        <div v-show="PaymentMethods.showing === 'flexMicroform'">
          <button
            id="payCard"
            type="button"
            v-on:click="savedCardOption('creditCard')"
            class="buttonCollapse"
          >
            Pay with card
          </button>
          <div v-show="showCreditCard" class="card-body">
            <iframe class="flex-iframe" v-bind:src="dfpUrl"> </iframe>
            <form id="my-form" onsubmit="return false">
              <div class="form-row margin-top-10">
                <div class="col-sm-6">
                  <label id="cardNumber-label" class="margin-0"
                    >Card Number</label
                  >
                  <div id="number-container-1" class="form-control"></div>
                </div>
                <div class="col-sm-6">
                  <label for="securityCode-container" class="margin-0"
                    >Security Code</label
                  >
                  <div id="securityCode-container" class="form-control"></div>
                </div>
              </div>
              <div class="form-row margin-top-10">
                <div class="form-group col-md-6">
                  <label for="expMonth" class="margin-0">Expiry month</label>
                  <select id="expMonth" name="expMonth" class="form-control">
                    <option>01</option>
                    <option>02</option>
                    <option>03</option>
                    <option>04</option>
                    <option>05</option>
                    <option>06</option>
                    <option>07</option>
                    <option>08</option>
                    <option>09</option>
                    <option>10</option>
                    <option>11</option>
                    <option>12</option>
                  </select>
                </div>
                <div class="form-group col-md-6">
                  <label for="expYear" class="margin-0">Expiry year</label>
                  <select id="expYear" name="expYear" class="form-control">
                    <option
                      v-for="optionData in expiryYearOption"
                      v-bind:key="optionData.value + '-label'"
                      v-bind:value="optionData.value"
                    >
                      {{ optionData.text }}
                    </option>
                  </select>
                </div>
              </div>
              <div v-show="isLoggedIn" class="form-row margin-top-10">
                <div class="form-group col-sm-12">
                  <label for="expMonth" class="margin-0"
                    >Saved token alias</label
                  >
                  <input
                    id="tokenAlias"
                    type="text"
                    name="tokenAlias"
                    class="form-control token-input"
                    value=""
                  />
                </div>
              </div>
            </form>
          </div>
          <button
            id="paySavedCard"
            v-show="isLoggedIn"
            type="button"
            v-on:click="savedCardOption('savedCard')"
            class="buttonCollapse"
          >
            Pay with saved card
          </button>
          <div v-show="showSavedCard" class="card-body">
            <select id="savedToken" class="form-control sl">
              <option
                v-for="optionData in selectOptions"
                v-bind:key="optionData.value"
                v-bind:value="optionData.value"
              >
                {{ optionData.text }}
              </option>
            </select>
            <div v-show="isLoggedIn" class="form-row margin-top-10">
              <div class="form-group col-sm-12">
                <label for="securityCodeCC" class="margin-0">Enter CVV</label>
                <input
                  id="securityCode"
                  type="text"
                  class="form-control token-input"
                  value=""
                  placeholder="..."
                />
              </div>
            </div>
          </div>
          <button
            @click="placeOrder"
            class="next-place-order margin-top-bottom-10"
            data-test="placeorder"
          >
            {{ $t("placeOrder") }}
          </button>
          <iframe
            id="cardinal_collection_iframe"
            name="collectionIframe"
            height="1"
            width="1"
            class="display-none"
          ></iframe>
          <form
            id="cardinal_collection_form"
            method="POST"
            target="collectionIframe"
            action
          >
            <input
              id="cardinal_collection_form_input"
              type="hidden"
              name="JWT"
              value
            />
          </form>
        </div>

        <input
          id="payment-method-5"
          v-model="PaymentMethods.showing"
          v-show="unifiedCheckout === 'false'"
          class="input-radio"
          type="radio"
          value="googlePay"
          name="payment_method"
          data-test="googlePay"
          @change="onPaymentMethodChange($event)"
        />
        <label for="payment-method-5" v-show="unifiedCheckout === 'false'"
          >GOOGLE PAY</label
        >
        <div v-show="PaymentMethods.showing === 'googlePay'">
          <form method="post" name="myForm" id="myForm">
            <div id="container" class="btnPad"></div>
          </form>
        </div>

        <input
          id="payment-method-6"
          v-model="PaymentMethods.showing"
          class="input-radio"
          type="radio"
          value="applePay"
          name="payment_method"
          data-test="applePay"
          @change="onPaymentMethodChange($event)"
        />
        <label for="payment-method-6">Apple Pay</label>
        <div v-show="PaymentMethods.showing === 'applePay'">
          <div
            class="apple-pay-button-with-text apple-pay-button-white-with-text"
            v-show="PaymentMethods.applePay.showButton"
            v-on:click="makePaymentApplePay()"
          >
            <span class="logo"></span>
          </div>
        </div>

        <input
          id="payment-method-7"
          v-model="PaymentMethods.showing"
          class="input-radio"
          type="radio"
          value="eCheck"
          name="payment_method"
          data-test="eCheck"
          @change="onPaymentMethodChange($event)"
        />
        <label for="payment-method-7">E-Check</label>
        <div v-show="PaymentMethods.showing === 'eCheck'" class="content">
          <div class="row">
            <div class="col">
              <label class="margin-0" for="accountNumber">Account Number</label>
              <input
                class="form-control form-width"
                type="text"
                id="accountNumber"
                name="accountNumber"
                placeholder="Enter Account Number"
              />
            </div>
            <div class="col">
              <label class="margin-0" for="routingNumber">Routing Number</label>
              <input
                class="form-control form-width"
                type="text"
                id="routingNumber"
                name="routingNumber"
                placeholder="Enter Routing Number"
              />
            </div>
          </div>
          <div class="form-row margin-top-10">
            <label class="margin-0" for="accountType">Account Type</label>
            <select class="form-control" name="accountType" id="accountType">
              <option value="C">Checking</option>
              <option value="S">Savings</option>
              <option value="X">Corporate Checking</option>
            </select>
          </div>
          <button
            @click="placeOrder"
            class="next-place-order margin-top-bottom-10"
            data-test="placeorder"
          >
            {{ $t("placeOrder") }}
          </button>
        </div>
        <input
          id="payment-method-8"
          v-model="PaymentMethods.showing"
          v-show="unifiedCheckout == 'true'"
          value="unifiedCheckout"
          class="input-radio"
          type="radio"
          name="payment_method"
          data-test="unifiedCheckout"
          @change="onPaymentMethodChange($event)"
        />
        <label for="payment-method-8" v-show="unifiedCheckout == 'true'"
          >Unified Checkout</label
        >
        <div v-show="PaymentMethods.showing === 'unifiedCheckout'">
          <button
            id="payCard"
            type="button"
            v-on:click="ucSavedCardOption('unifiedCheckout')"
            class="buttonCollapse"
          >
            Pay with card
          </button>
          <div v-show="showUc" class="card-body">
            <div v-if="showUnifiedMethods" id="buttonPaymentListContainers">
              <button
                type="button"
                id="checkoutEmbedded"
                class="btn btn-lg btn-block btn-primary"
                disabled="disabled"
              >
                Loading...
              </button>
              <button
                type="button"
                id="checkoutSidebar"
                class="btn btn-lg btn-block btn-primary"
                disabled="disabled"
              >
                Loading...
              </button>
            </div>
            <div id="embeddedPaymentContainer"></div>
            <div v-show="isLoggedIn" class="form-row margin-top-10">
              <div class="form-group col-sm-12">
                <label for="Saved token alias" class="margin-0"
                  >Saved token alias</label
                >
                <input
                  id="ucTokenAlias"
                  type="text"
                  name="uctokenAlias"
                  class="form-control token-input"
                  value=""
                />
              </div>
            </div>
          </div>
          <button
            id="ucPaySavedCard"
            v-show="isLoggedIn"
            type="button"
            v-on:click="ucSavedCardOption('savedCard')"
            class="buttonCollapse"
          >
            Pay with saved card
          </button>
          <div v-show="showSavedCardforUc" class="card-body">
            <select id="ucSavedToken" class="form-control sl">
              <option
                v-for="optionData in selectOptions"
                v-bind:key="optionData.value"
                v-bind:value="optionData.value"
              >
                {{ optionData.text }}
              </option>
            </select>
            <div v-show="isLoggedIn" class="form-row margin-top-10">
              <div class="form-group col-sm-12">
                <label for="ucSecurityCode" class="margin-0">Enter CVV</label>
                <input
                  id="ucSecurityCode"
                  type="text"
                  class="form-control token-input"
                  value=""
                  placeholder="..."
                />
              </div>
            </div>
            <button
              @click="placeOrder"
              class="next-place-order margin-top-bottom-10"
              data-test="placeorder"
            >
              {{ $t("placeOrder") }}
            </button>
          </div>
        </div>
      </div>

      <div v-show="error != null">
        <div class="error-message color-red">
          {{ error }}
        </div>
        <div class="error-message color-red" id="errorId">
          {{ errorId }}
        </div>
      </div>
      <div class="modal-backdrop" v-show="isShow">
        <div class="modal" role="dialog">
          <section class="modal-body content-display" id="modalDescription">
            <slot name="body">
              <iframe
                id="3dsIframe"
                name="step-up-iframe"
                height="400"
                width="400"
                class="frameDisplay"
              ></iframe>
              <form
                id="step-up-form"
                target="step-up-iframe"
                method="post"
                action
              >
                <input
                  type="hidden"
                  id="step-up-formInput"
                  name="JWT"
                  value=""
                />
                <input type="hidden" name="MD" value="" />
              </form>
            </slot>
          </section>
        </div>
      </div>
    </div>
  </span>
</template>
