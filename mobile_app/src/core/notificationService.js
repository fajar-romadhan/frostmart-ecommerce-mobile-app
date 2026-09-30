import { Platform } from 'react-native';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority?.MAX || 'max',
      }),
    });
  }
} catch (e) {
  console.log('expo-notifications module optional load info:', e?.message || e);
}

let Audio = null;
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.log('expo-av optional load info:', e?.message || e);
}

export const NotificationService = {
  // Inisialisasi izin & channel notifikasi Android/iOS
  async init() {
    if (!Notifications) return false;
    try {
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Notifikasi Pesanan & Chat Toko',
          importance: Notifications.AndroidImportance?.MAX || 5,
          vibrationPattern: [0, 250, 150, 250],
          lightColor: '#059669',
          playSound: true,
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }

      if (Notifications.getPermissionsAsync) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted' && Notifications.requestPermissionsAsync) {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        return finalStatus === 'granted';
      }
    } catch (e) {
      console.log('NotificationService init info:', e?.message || e);
    }
    return false;
  },

  // Play signature iOS Tri-Tone / Glass Notification Sound
  async playIosNotificationSound() {
    try {
      // 1. Web Platform (Authentic iOS Tri-Tone Synth using Web Audio API)
      if (Platform.OS === 'web' || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const now = ctx.currentTime;

            // Authentic iOS Tri-Tone Frequencies: B5 (987.77Hz), G6 (1567.98Hz), E6 (1318.51Hz)
            const notes = [
              { freq: 1318.51, start: 0, dur: 0.12 },
              { freq: 1567.98, start: 0.10, dur: 0.12 },
              { freq: 2093.00, start: 0.22, dur: 0.28 }
            ];

            notes.forEach((n) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();

              osc.type = 'sine';
              osc.frequency.setValueAtTime(n.freq, now + n.start);

              gain.gain.setValueAtTime(0.35, now + n.start);
              gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

              osc.connect(gain);
              gain.connect(ctx.destination);

              osc.start(now + n.start);
              osc.stop(now + n.start + n.dur);
            });
            return;
          }
        } catch (e) {
          console.log('Web Audio Context chime error:', e);
        }
      }

      // 2. Native Mobile (expo-av)
      if (Audio) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });

        // Use iOS notification chime sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
          { shouldPlay: true, volume: 1.0 }
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
          }
        });
      }
    } catch (err) {
      console.log('Error playing iOS notification sound:', err);
    }
  },

  // Memicu notifikasi lokal di status bar HP (Pop-up Heads-Up Notification)
  async triggerLocalOrderNotification(orderCode, totalAmount, userName, customTitle = null, customBody = null) {
    // Always play iOS notification chime sound
    this.playIosNotificationSound();

    if (!Notifications || !Notifications.scheduleNotificationAsync) return;
    try {
      const title = customTitle || '🛍️ PESANAN BARU MASUK!';
      const body = customBody || `Pesanan ${orderCode} dari ${userName} (Rp${(totalAmount || 0).toLocaleString('id-ID')})`;
      const targetScreen = customTitle?.toLowerCase()?.includes('chat') ? 'OrderChat' : 'AdminOrder';

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { orderCode, screen: targetScreen },
          sound: true,
          channelId: 'orders',
          priority: Notifications.AndroidNotificationPriority?.MAX || 'max',
          vibrate: [0, 250, 150, 250],
        },
        trigger: null,
      });
    } catch (e) {
      console.log('Error triggering local notification:', e);
    }
  },
};

export default NotificationService;
