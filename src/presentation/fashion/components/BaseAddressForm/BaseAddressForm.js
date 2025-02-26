// import { required, email, numeric } from 'vuelidate/lib/validators';
// import BaseInput from '../../../fashion/components/BaseInput/BaseInput.vue';
// import BaseSelect from '../../../fashion/components/BaseSelect/BaseSelect.vue';
// import ServerError from '../../../fashion/components/ServerError/ServerError.vue';
// import BaseForm from '../../../fashion/components/BaseForm/BaseForm.vue';

// export default {
//   props: {
//     address: Object,
//   },
//   components: {
//     BaseForm,
//     ServerError,
//     BaseInput,
//     BaseSelect,
//   },
//   data: () => ({
//     form: {},
//   }),
//   watch: {
//     formToJSON() {
//       this.$emit('update-address', this.form);
//     },
//     validForm() {
//       this.$emit('valid-form', this.validForm);
//     },
//   },
//   computed: {
//     countries() {
//       const configCountries = this.$sunrise.countries;
//       const countries = configCountries ? Object.entries(configCountries)
//         .filter(([id]) => id === this.$route.params.country)
//         : [];
//       return countries.map(([id, name]) => ({ id, name }));
//     },
//     formToJSON() {
//       return JSON.stringify(this.form);
//     },
//     validForm() {
//       return !this.$v.$invalid;
//     },
//   },
//   created() {
//     if (this.address) {
//       const { contactInfo, ...address } = this.address;
//       this.form = { ...contactInfo, ...address };
//       delete this.form.__typename;
//     }
//     if (!this.form.country) {
//       this.form = { ...this.form, country: this.$route.params.country };
//     }
//   },
//   validations: {
//     form: {
//       firstName: { required },
//       lastName: { required },
//       streetName: { required },
//       additionalStreetInfo: {},
//       postalCode: { required, numeric },
//       city: { required },
//       country: { required },
//       phone: { numeric },
//       region: { required },
//       email: { required, email },
//     },
//   },
// };

import { reactive, computed, watch } from 'vue';
import useVuelidate from '@vuelidate/core';
import { required, email, numeric } from '@vuelidate/validators';
import BaseInput from '../../../fashion/components/BaseInput/BaseInput.vue';
import BaseSelect from '../../../fashion/components/BaseSelect/BaseSelect.vue';
import ServerError from '../../../fashion/components/ServerError/ServerError.vue';
import BaseForm from '../../../fashion/components/BaseForm/BaseForm.vue';
import { useRouter } from 'vue-router';
import sunriseConfig from '../../../../../sunrise.config';
export default {
  props: {
    address: Object,
  },
  components: {
    BaseInput,
    BaseSelect,
    ServerError,
    BaseForm,
  },
  setup(props, { emit }) {
    
    const form = reactive({
      firstName: '',
      lastName: '',
      streetName: '',
      additionalStreetInfo: '',
      postalCode: '',
      city: '',
      country: '',
      phone: '',
      region: '',
      email: '',
      ...props.address,
    });

    // Vuelidate rules for the form fields
    const rules = {
      form: {
        firstName: { required },
        lastName: { required },
        streetName: { required },
        additionalStreetInfo: {},
        postalCode: { required, numeric },
        city: { required },
        country: { required },
        phone: { numeric },
        region: { required },
        email: { required, email },
      },
    };

    // Initialize Vuelidate
    const v$ = useVuelidate(rules, { form });
    // Computed property to fetch countries
    // const countries = computed(() => {
    //   const configCountries = props.$sunrise?.countries || {};
    //   return Object.entries(configCountries).map(([id, name]) => ({ id, name }));
    // });
    const route = useRouter();

    // Computed property for countries
    const countries = computed(() => {
      const configCountries = sunriseConfig?.countries || {};
      const filteredCountries = configCountries ? Object.entries(configCountries)
        .filter(([id]) => id === route.currentRoute.value.params.country)
        : [];
      return filteredCountries.map(([id, name]) => ({ id, name }));
    });


    // Watch form changes and emit updated address
    watch(
      form,
      () => emit('update-address', form),
      { deep: true }
    );

    // Watch validation state and emit validity status if v$ is available
    watch(
      () => v$.value?.form?.$invalid,
      (isInvalid) => {
        if (v$.value) emit('valid-form', !isInvalid);
      }
    );
    const setDefaultCountry = () => {
      if (countries?.value?.length > 0 && !form?.value?.country) {
        // Set the first country's ID as default if no country is selected
        form.country = countries.value[0].id;
      }
    };

    // Watch countries to set the default country when the list changes
    watch(countries, () => {
      setDefaultCountry();
    }, { immediate: true }); 

    return {
      form,
      v$,
      countries,
    };
  },
};
