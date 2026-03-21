import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { checkIn, checkOut } from './api';

const QUEUE_KEY = 'offline_queue';

export const addToQueue = async (action, data) => {
  const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ action, data, timestamp: new Date().toISOString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const getQueueLength = async () => {
  const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
  return queue.length;
};

export const syncQueue = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { synced: 0, failed: 0 };

  const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY) || '[]');
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      if (item.action === 'check-in') {
        await checkIn(item.data);
      } else if (item.action === 'check-out') {
        await checkOut(item.data);
      }
      synced++;
    } catch (err) {
      // If it's a duplicate or validation error, discard it
      if (err.response?.status === 400 || err.response?.status === 409) {
        synced++;
      } else {
        remaining.push(item);
        failed++;
      }
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { synced, failed };
};

export const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};
