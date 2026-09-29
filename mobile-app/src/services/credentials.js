import * as SecureStore from 'expo-secure-store';

function key(field) {
  // SecureStore keys must be alphanumeric/._- only.
  // Keep the historical "staff" key so credentials saved by older builds still autofill.
  return `geoattend_staff_cred_${field}`;
}

export async function saveCredentials({ identifier, password }) {
  if (!identifier || !password) return;
  await SecureStore.setItemAsync(key('id'), identifier, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  await SecureStore.setItemAsync(key('pw'), password, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function getCredentials() {
  const identifier = await SecureStore.getItemAsync(key('id'));
  const password = await SecureStore.getItemAsync(key('pw'));
  if (!identifier || !password) return null;
  return { identifier, password };
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(key('id'));
  await SecureStore.deleteItemAsync(key('pw'));
}
