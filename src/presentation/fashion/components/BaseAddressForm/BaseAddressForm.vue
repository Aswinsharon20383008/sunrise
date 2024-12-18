<!-- <i18n src="./BaseAddressForm.txt"></i18n>
<script src="./BaseAddressForm.js"></script>

<template>
  <div class="row">
    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('firstName') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          :vuelidate="$v.form.firstName"
          v-model="form.firstName"
          type="text"
          data-test="address-form-firstName"
        />
      </div>
    </div>
    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('lastName') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          :vuelidate="$v.form.lastName"
          v-model="form.lastName"
          type="text"
          data-test="address-form-lastName"
        />
      </div>
    </div>

    <div class="col-lg-12">
      <div class="billing-info mb-25">
        <label>
          {{ $t('address') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          class="billing-address"
          v-model="form.streetName"
          :vuelidate="$v.form.streetName"
          :placeholder="$t('streetName')"
          type="text"
          data-test="address-form-streetName"
        />
        <input
          v-model="form.additionalStreetInfo"
          :placeholder="$t('additional')"
          type="text"
          data-test="address-form-additionalStreetInfo"
        />
      </div>
    </div>
    <div class="col-lg-4 col-md-4">
      <div class="billing-info mb-25">
        <label>
          {{ $t('postCode') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          :vuelidate="$v.form.postalCode"
          v-model="form.postalCode"
          type="text"
          data-test="address-form-postalCode"
        />
      </div>
    </div>
    <div class="col-lg-4 col-md-4">
      <div class="billing-info mb-25">
        <label>
          {{ $t('region') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          :vuelidate="$v.form.region"
          v-model="form.region"
          type="text"
          data-test="address-form-region"
        />
      </div>
    </div>
    <div class="col-lg-4 col-md-4">
      <div class="billing-info mb-25">
        <label>
          {{ $t('city') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          :vuelidate="$v.form.city"
          v-model="form.city" type="text"
          data-test="address-form-city"
        />
      </div>
    </div>
    <div class="col-lg-12">
      <div class="billing-select mb-25">
        <label>
          {{ $t('country') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <select
          :vuelidate="$v.form.country"
          v-model="form.country"
          class="select"
        >
          <option
            v-for="country in countries"
            :value="country.id"
            :key="country.id"
            >{{ country.name }}</option
          >
        </select>
      </div>
    </div>
    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('phone') }}
        </label>
        <input
          :vuelidate="$v.form.phone"
          v-model="form.phone" type="tel"
          data-test="address-form-phone"
        />
      </div>
    </div>
    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('email') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          :vuelidate="$v.form.email"
          v-model="form.email" type="email"
          data-test="address-form-email"
        />
      </div>
    </div>
  </div>
</template> -->

<i18n src="./BaseAddressForm.txt"></i18n>
<script src="./BaseAddressForm.js"></script>

<template>
  <div class="row">
    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('firstName') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          v-model="form.firstName"
          :class="{ 'is-invalid': v$.form.firstName.$invalid && v$.form.firstName.$dirty }"
          type="text"
          data-test="address-form-firstName"
        />
      </div>
    </div>
    
    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('lastName') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          v-model="form.lastName"
          :class="{ 'is-invalid': v$.form.lastName.$invalid && v$.form.lastName.$dirty }"
          type="text"
          data-test="address-form-lastName"
        />
      </div>
    </div>

    <div class="col-lg-12">
      <div class="billing-info mb-25">
        <label>
          {{ $t('address') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          v-model="form.streetName"
          :class="{ 'is-invalid': v$.form.streetName.$invalid && v$.form.streetName.$dirty }"
          :placeholder="$t('streetName')"
          type="text"
          data-test="address-form-streetName"
        />
        <input
          v-model="form.additionalStreetInfo"
          :placeholder="$t('additional')"
          type="text"
          data-test="address-form-additionalStreetInfo"
        />
      </div>
    </div>

    <div class="col-lg-4 col-md-4">
      <div class="billing-info mb-25">
        <label>
          {{ $t('postCode') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          v-model="form.postalCode"
          :class="{ 'is-invalid': v$.form.postalCode.$invalid && v$.form.postalCode.$dirty }"
          type="text"
          data-test="address-form-postalCode"
        />
      </div>
    </div>

    <div class="col-lg-4 col-md-4">
      <div class="billing-info mb-25">
        <label>
          {{ $t('region') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          v-model="form.region"
          :class="{ 'is-invalid': v$.form.region.$invalid && v$.form.region.$dirty }"
          type="text"
          data-test="address-form-region"
        />
      </div>
    </div>

    <div class="col-lg-4 col-md-4">
      <div class="billing-info mb-25">
        <label>
          {{ $t('city') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          v-model="form.city"
          :class="{ 'is-invalid': v$.form.city.$invalid && v$.form.city.$dirty }"
          type="text"
          data-test="address-form-city"
        />
      </div>
    </div>

    <div class="col-lg-12">
      <div class="billing-select mb-25">
        <label>
          {{ $t('country') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <select
          v-model="form.country"
          :class="{ 'is-invalid': v$.form.country.$invalid && v$.form.country.$dirty }"
          class="select"
        >

          <option v-for="country in countries" :value="country.id" :key="country.id">
            {{ country.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('phone') }}
        </label>
        <input
          v-model="form.phone"
          :class="{ 'is-invalid': v$.form.phone.$invalid && v$.form.phone.$dirty }"
          type="tel"
          data-test="address-form-phone"
        />
      </div>
    </div>

    <div class="col-lg-6 col-md-6">
      <div class="billing-info mb-25">
        <label>
          {{ $t('email') }}
          <abbr class="required" title="required">*</abbr>
        </label>
        <input
          v-model="form.email"
          :class="{ 'is-invalid': v$.form.email.$invalid && v$.form.email.$dirty }"
          type="email"
          data-test="address-form-email"
        />
      </div>
    </div>
  </div>
</template>
