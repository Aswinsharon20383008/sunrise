import { useI18n } from 'vue-i18n';
import useCustomerTools from 'hooks/useCustomerTools';
<i18n src="./LoginButton.txt" lang="yaml"></i18n>

export default {
  props: {},
  setup() {
    const { t } = useI18n();
    console.log('ii8n',t('myAccount'));
    const { showLoggedIn } = useCustomerTools();
    return { t, showLoggedIn };
  },
};
