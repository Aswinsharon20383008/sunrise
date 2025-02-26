
<style src="./TabMyCardsUpdate.scss" lang="scss" scoped></style>
<script src="./TabMyCardsUpdate.js"></script>

<template>
  <div v-if="me" class="myaccount-content">
    <h3 v-if="!showAddress">Update Card</h3>
    <h3 v-else>{{ $t("Addresses") }}</h3>
    <div class="account-details-form">
      <div id="loading" v-if="loading"><span> Loading... </span></div>
      <div id="updateCardTab" v-show="!showAddress">
        <div class="row">
          <div class="col-lg-6">
            <div class="single-input-item">
              <label class="h6 card-title label-title">
                Card number
              </label>
              <input
                name="cardNumber"
                class="form-control font-size"
                id="cardNumber"
                :value="customerTokenObj?.cardNumber"
                readonly
              />
            </div>
          </div>
          <div class="col-lg-6">
            <div class="single-input-item">
              <label class="h6 card-title label-title">
                Card alias
              </label>
              <input
                name="cardAlias"
                class="form-control font-size"
                id="cardAlias"
                :value="customerTokenObj?.alias"
                readonly
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-lg-6">
            <div class="single-input-item">
              <label class="h6 card-title label-title"> Expiry Month</label>
              <select
                name="expirationMonth"
                class="form-control"
                :id="'expirationMonth' + customerTokenObj?.paymentToken"
                @change = "onMonthChange($event)"
              >
                {{
                  getMonth(customerTokenObj?.cardExpiryMonth)
                }}
                >
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="single-input-item">
              <label class="h6 card-title label-title">
                Expiry Year
              </label>
              <select
                name="expirationYear"
                class="form-control"
                :id="'expirationYear' + customerTokenObj?.paymentToken"
                @change = "onYearChange($event)"
              >
                <option
                  v-for="optionData in expiryYearOption"
                  v-bind:key="optionData.value"
                  v-bind:value="optionData.value"
                  >{{ optionData.text }}</option
                >
              </select>
            </div>
          </div>
        </div>
        <div class="row div-row-alter">
          <div class="col-lg-4">
            <h4 class="font-weight">Address:</h4>
           
            <div v-for="address in displayAddresses"
              :key="address.id">
              <div v-if="customerTokenObj?.addressId == address.id" >
               <!-- todo:modified converted to separate div -->
            
              <div>{{ address.firstName }} {{ address.lastName }}</div>
              <div>{{ address.streetName }}</div>
              <div>{{ address.city }}</div>
              <div>{{ address.region }} {{ address.country }}</div>
              <div>{{ address.postalCode }}</div>
            </div>
          </div>
        </div>
        </div>
        <div class="row">
          <div class="col-lg-6">
            <button @click="navigateToMyCards()">Cancel</button>
          </div>
          <div class="col-lg-6 text-align-right">
            <button
              class="margin-right-10"
              v-on:click="updateAddress(customerTokenObj?.addressId)"
              id="updateAddress"
            >
              Update Address
            </button>
            <button
              v-on:click="updateToken(customerTokenObj)"
              class="check-btn sqr-btn"
              id="update"
            >
              Update
            </button>
          </div>
        </div>
      </div>
      <div id="addressesTab" v-show="showAddress">
        <div id="savedAddress" v-show="addressesLength > 0">
          <div class="myaccount-table table-responsive text-center">
            <table class="table table-bordered">
              <tbody>
                <tr v-for="address in addresses" :key="address.id">
                  <td>
                    <input
                      :id="'address_' + address.id"
                      :checked="address.id == selectedAddressId"
                      class="input-radio"
                      type="radio"
                      :value="address.id"
                      :name="'address_' + address.id"
                      @change="onAddressChange($event)"
                    />
                  </td>
                  <td>
                    {{
                      address.streetName +
                        " " +
                        address.city +
                        " " +
                        address.region +
                        " " +
                        address.country +
                        " " +
                        address.postalCode
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="row margin-left-0 margin-right-0">
            <div class="col-lg-2 padding-left-0">
              <button v-on:click="showUpdateForm()">
                Back
              </button>
            </div>
            <div class="col-lg-10 text-align-right padding-right-0">
              <button
                id="addNewAddress"
                type="button"
                v-on:click="showNewAdress()"
                class="buttonCollapse margin-right-10"
              >
                Add New Address
              </button>
              <button
                id="addAddress"
                type="button"
                v-on:click="updateToken(customerTokenObj)"
                class="buttonCollapse"
              >
                Update
              </button>
            </div>
          </div>
        </div>
        <div id="addressForm" v-show="addressesLength == 0">
          <BaseAddressForm
            @update-address="updateBillingAddress"
            @valid-form="validBillingForm"
            :address="billingAddress"
          />
          <div class="row">
            <div class="col-lg-6">
              <button
                id="cancelAddress"
                type="button"
                v-on:click="cancelAddress(customerTokenObj?.addressId)"
                class="buttonCollapse"
              >
                Cancel
              </button>
            </div>
            <div class="col-lg-6 text-align-right">
              <button
                id="addAddress"
                type="button"
                v-on:click="updateToken(customerTokenObj)"
                class="buttonCollapse"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
