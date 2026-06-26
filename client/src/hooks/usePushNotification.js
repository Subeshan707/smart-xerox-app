import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../api/axios';

const urlB64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function usePushNotification() {
  const { user, token } = useSelector(state => state.auth);

  useEffect(() => {
    if (!user || !token) return;

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(swReg) {
          Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
              // Should normally come from backend config or env
              const applicationServerKey = urlB64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5ME8oZk7_Z_XhL0z8y3mH0');
              swReg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
              }).then(function(subscription) {
                // Send subscription to server
                api.post('/push/subscribe', subscription).catch(e => console.error(e));
              }).catch(function(err) {
                console.log('Failed to subscribe the user: ', err);
              });
            }
          });
        })
        .catch(function(error) {
          console.error('Service Worker Error', error);
        });
    }
  }, [user, token]);
}
