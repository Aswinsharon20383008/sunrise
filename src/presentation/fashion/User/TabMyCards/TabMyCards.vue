<i18n src="./TabMyCards.txt"></i18n>
<style src="./TabMyCards.scss" lang="scss" scoped></style>
<script src="./TabMyCards.js"></script>

<template>
  <div v-if="me" class="myaccount-content">
    <h3 v-if="!showAddress">My Cards</h3>
    <h3 v-else>{{ $t("Addresses") }}</h3>
    <div v-show="error != null">
      <div class="errorMessage" id="errorMessage">
        {{ error }}
      </div>
    </div>
    <div v-show="success != null">
      <div class="successMessage" id="successMessage">{{ success }}</div>
    </div>
    <div id="loading" v-if="loading"><span> Loading... </span></div>
    <div v-show="!showAddress">
      <div v-show="customerTokenObjLen > 0 && !showMyAccountFlex" class="padd10">
        <div class="row div-row div-row-style">
          <div class="col-lg-2">{{ $t("cardAlias") }}</div>
          <div class="col-lg-3">{{ $t("cardNumber") }}</div>
          <div class="col-lg-3 tdCenterAlign">{{ $t("expiryMonth") }}</div>
          <div class="col-lg-2 tdCenterAlign">{{ $t("expiryYear") }}</div>
          <div class="col-lg-2 tdCenterAlign">
            More
          </div>
        </div>
        <div v-for="customerTokenObj in customerTokenObjs" :key="customerTokenObj.paymentToken">
          <div class="row div-row">
            <div class="col-lg-2">{{ customerTokenObj.alias }}</div>
            <div class="col-lg-3">{{ customerTokenObj.cardNumber }}</div>
            <div class="col-lg-3 tdCenterAlign">
              {{ customerTokenObj.cardExpiryMonth }}
            </div>
            <div class="col-lg-2 tdCenterAlign">
              {{ customerTokenObj.cardExpiryYear }}
            </div>
            <div class="col-lg-2 tdCenterAlign" v-on:click="showDiv(customerTokenObj.paymentToken)">
              <i class="dl-icon-menu1"></i>
            </div>
          </div>
          <div class="row div-row-alter" v-show="isOpenIndex === customerTokenObj.paymentToken">
            <div class="col-lg-4 pad-15">
              <h4 class="font-weight">Address:</h4>
                   <!-- <div
                v-for="address in displayAddresses.value"
                :key="address.id"
                v-if="customerTokenObj.addressId == address.id
              > -->
          <!-- todo:modified converted  div -->
          <div
            v-for="address in ((displayAddresses && displayAddresses) ? displayAddresses.filter(addr => addr.id === customerTokenObj?.addressId) : [])"
            :key="address.id">
                <div>{{ address.firstName }} {{ address.lastName }}</div>
                <div>{{ address.streetName }}</div>
                <div>{{ address.city }}</div>
                <div>{{ address.additionalStreetInfo }}</div>
                <div>{{ address.region }} {{ address.country }}</div>
                <div>{{ address.postalCode }}</div>
              </div>
            </div>
            <div class="col-lg-8">
              <div class="action-buttons-div">
                <button @click="navigateToUpdate(customerTokenObj.paymentToken)"
                 class="margin-right-10">
                  Edit
                </button>
                <button v-on:click="deleteToken(customerTokenObj)">
                  {{ $t("delete") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-show="customerTokenObjLen == 0 && !showMyAccountFlex" data-test="empty-token-list" class="padd10">
        <span>
          {{ $t("emptyTokens") }}
        </span>
      </div>

      <button id="addCard" type="button" v-on:click="renderFunction()" class="buttonCollapse">
        Add card
      </button>




    </div>
    <div id="myAccountFlex" v-show="showMyAccountFlex">
      <iframe class="flex-iframe" v-bind:src="dfpUrl"> </iframe>
      <form id="my-form" onsubmit="return false">
        <div class="form-row margin-top-30">
          <div class="form-group col-md-3">
            <label id="cardNumber-label" class="margin-0">Card Alias</label>
            <input id="tokenAlias" type="text" name="tokenAlias" class="form-control token-input" value="" />
          </div>
          <div class="col-sm-4">
            <label id="cardNumber-label" class="margin-0">Card Number</label>
            <div id="number-container-1" class="form-control"></div>
          </div>
          <div class="col-sm-2">
            <label for="securityCode-container" class="margin-0">Security Code</label>
            <div id="securityCode-container" class="form-control"></div>
          </div>
          <div class="form-group col-md-3">
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
          <div class="form-group col-md-3">
            <label for="expYear" class="margin-0">Expiry year</label>
            <select id="expYear" name="expYear" class="form-control">
              <option v-for="optionData in expiryYearOption" v-bind:key="optionData.value + '-label'"
                v-bind:value="optionData.value">{{ optionData.text }}</option>
            </select>
          </div>
        </div>
        <div id="actionButtons">
          <button id="submitCard" type="button" v-on:click="submitCard()" class="buttonCollapse">
            Next
          </button>
          <button id="closeAddCard" type="button" v-on:click="closeSaveCardMyAccount()" class="buttonCollapse">
            Cancel
          </button>
        </div>
      </form>
    </div>
    <div id="addressesTab" v-show="showAddress">
      <div id="savedAddress" v-show="addressesLength > 0">
        <div class="myaccount-table table-responsive text-center">
          <table class="table table-bordered">
            <tbody>
              <tr v-for="address in addresses" :key="address.id">
                <td>
                  <input :id="'address_' + address.id" v-model="selectedAddressId" class="input-radio" type="radio"
                    :value="address.id" :name="'address_' + address.id" @change="onAddressChange($event)" />
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
        <div class="row">
          <div class="col-lg-2">
            <button id="addNewAddress" type="button" v-on:click="showMyCards()" class="buttonCollapse">
              Back
            </button>
          </div>
          <div class="col-lg-10 text-align-right">
            <button id="addNewAddress" type="button" v-on:click="showNewAdress()"
              class="buttonCollapse margin-right-10">
              Add New Address
            </button>
            <button id="addAddress" type="button" v-on:click="addAddress()" class="buttonCollapse">
              Save
            </button>
          </div>
        </div>
      </div>
      <div id="addressForm" v-show="addressesLength == 0">
        <BaseAddressForm @update-address="updateBillingAddress" @valid-form="validBillingForm"
          :address="billingAddress" />
        <div class="row">
          <div class="col-lg-2">
            <button id="cancelAddress" type="button" v-on:click="cancelAddress()" class="buttonCollapse">
              Cancel
            </button>
          </div>
          <div class="col-lg-10 text-align-right">
            <button id="addAddress" type="button" v-on:click="addAddress()" class="buttonCollapse">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="form-group col-sm-12" id="ucTokenAliasDiv" v-show="showUCTokenAlias">
      <label for="Saved token alias" class="margin-0">Saved token alias</label>
      <input id="ucTokenAlias" type="text" name="uctokenAlias" class="form-control token-input" value="" />
    </div>
    <div id="addressesTab" v-show="showAddressforUC">
      <div id="savedAddress" v-show="addressesLength > 0">
        <div class="myaccount-table table-responsive text-center">
          <table class="table table-bordered">
            <tbody>
              <tr v-for="address in addresses" :key="address.id">
                <td>
                  <input :id="'address_' + address.id" v-model="selectedAddressId" class="input-radio" type="radio"
                    :value="address.id" :name="'address_' + address.id" @change="onAddressChange($event)" />
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
        <div class="row">
          <div class="col-lg-2">
            <button id="addNewAddress" type="button" v-on:click="closeSaveCardMyAccountUC()" class="buttonCollapse">
              Cancel
            </button>
          </div>
          <div class="col-lg-10 text-align-right">
            <button id="addNewAddress" type="button" v-on:click="showNewAdress()"
              class="buttonCollapse margin-right-10">
              Add New Address
            </button>
            <button id="addAddress" type="button" v-on:click="ucNext()" class="buttonCollapse">
              Next
            </button>
          </div>
        </div>
      </div>
      <div id="addressForm" v-show="addressesLength == 0">
        <BaseAddressForm @update-address="updateBillingAddress" @valid-form="validBillingForm"
          :address="billingAddress" />
        <div class="row">
          <div class="col-lg-2">
            <button id="cancelAddress" type="button" v-on:click="cancelAddress()" class="buttonCollapse">
              Cancel
            </button>
          </div>
          <div class="col-lg-10 text-align-right">
            <button id="addAddress" type="button" v-on:click="ucNext()" class="buttonCollapse">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-show="showUc" class="card-body">
      <div v-if="showUnifiedMethods" id="buttonPaymentListContainers">
        <button type="button" id="checkoutEmbedded" class="btn btn-lg btn-block btn-primary" disabled="disabled">
          Loading...
        </button>
        <button type="button" id="checkoutSidebar" class="btn btn-lg btn-block btn-primary" disabled="disabled">
          Loading...
        </button>
      </div>
      <div id="embeddedPaymentContainer"></div>

    </div>
  </div>
</template>
