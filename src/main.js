import { createApp, provide, h } from 'vue';
import { DefaultApolloClient } from '@vue/apollo-composable';
import App from './App.vue';
import { apolloClient } from './apollo';
import router from './router';
import VueGoogleMaps from '@fawmi/vue-google-maps';
import i18n from './i18n';
import store from './store';
import 'presentation/assets/scss/main.scss';

const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient);
  },

  render: () => h(App),
})
  .use(VueGoogleMaps, {
    load: {
      key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
      libraries: 'places',
    },
  })
  .use(i18n)
  .use(router)
  .use(store)

app.config.errorHandler = (err, vm, info) => {
  console.error("Global Error Handler:", err);
  console.error("Error info:", info);

  // Prevent the error from showing on the screen (by default Vue shows it)
};

app.config.warnHandler = (msg, instance, trace) => {
  console.warn("Vue Warning:", msg, "Component:", instance, "Trace:", trace);
};
app.mount('#app');