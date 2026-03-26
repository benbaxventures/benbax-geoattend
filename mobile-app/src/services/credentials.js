import * as SecureStore from 'expo-secure-store';

function key(memberType, field) {
  const mt = memberType === 'student' ? 'student' : 'staff';
  // SecureStore keys must be alphanumeric/._- only
  return `geoattend_${mt}_cred_${field}`;
}

export async function saveCredentials({ memberType, identifier, password }) {
  if (!identifier || !password) return;
  await SecureStore.setItemAsync(key(memberType, 'id'), identifier, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
  await SecureStore.setItemAsync(key(memberType, 'pw'), password, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function getCredentials(memberType) {
  const identifier = await SecureStore.getItemAsync(key(memberType, 'id'));
  const password = await SecureStore.getItemAsync(key(memberType, 'pw'));
  if (!identifier || !password) return null;
  return { identifier, password };
}

export async function clearCredentials(memberType) {
  await SecureStore.deleteItemAsync(key(memberType, 'id'));
  await SecureStore.deleteItemAsync(key(memberType, 'pw'));
}

