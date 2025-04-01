export const mapAddress = (
  firstName,
  lastName,
  streetName,
  additionalStreetInfo,
  city,
  postalCode,
  region,
  country,
  email,
  phone
) => {
  return {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(streetName && { streetName }),
    ...(additionalStreetInfo && { additionalStreetInfo }),
    ...(city && { city }),
    ...(postalCode && { postalCode }),
    ...(region && { region }),
    ...(country && { country }),
    ...(email && { email }),
    ...(phone && { phone }),
  };
};
