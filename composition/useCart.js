// import useLocale from './useLocale';
// import useCart from './ct/useCart';
// import addVisibilityChangeListener from './lib';
// import { cache } from '../src/apollo';
// // import config from '../sunrise.config';
// addVisibilityChangeListener((status) => {
//   if (status) {
//     cache.evict({ id: 'activeCart' });
//     cache.gc();
//   }
// });

// //Vue/app specific code
// export default () => {
//   const localeResponse = useLocale();
//   const { locale } = localeResponse || 'en';
//   return useCart({
//     locale,
//   });
// };
import useLocale from './useLocale';
import useCart from './ct/useCart';
import addVisibilityChangeListener from './lib';
import { cache } from '../src/apollo';
// import config from '../sunrise.config';
addVisibilityChangeListener((status) => {
  if (status) {
    cache.evict({ id: 'activeCart' });
    cache.gc();
  }
});

//Vue/app specific code
export default () => {
  const localeResponse = useLocale();
  const { locale } = localeResponse || 'en';
  return useCart({
    locale,
  });
};
