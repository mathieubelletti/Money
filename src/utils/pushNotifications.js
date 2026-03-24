import { supabase } from '../supabase';

// Clé publique VAPID générée pour ce projet
const PUBLIC_VAPID_KEY = 'BCKAoSG40WxuelI_2OI-xJlnesudqyW0fbzCQXY35EFi8s9Gg-5iflL_dyf_CvJCBEVT6syMTdSmDY0_q-r3zFM';

// Fonction utilitaire pour convertir la clé VAPID pour le navigateur
function urlBase64ToUint8Array(base64String) {
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
}

/**
 * Tente d'abonner l'utilisateur aux notifications Web Push
 * et enregistre l'abonnement dans Supabase.
 */
export async function activatePushNotifications() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker non supporté par ce navigateur.');
    return { success: false, error: 'Service workers non supportés' };
  }
  
  if (!('PushManager' in window)) {
    console.error('Push Notifications non supportées par ce navigateur.');
    return { success: false, error: 'Push notifications non supportées' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Demande l'abonnement auprès du Push Service du navigateur
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    // Extraction des informations
    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint;
    const p256dh = subJson.keys.p256dh;
    const auth = subJson.keys.auth;

    // Récupération de l'utilisateur actuel
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    // Sauvegarde en base de données
    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        endpoint: endpoint,
        p256dh: p256dh,
        auth: auth
      }, { onConflict: 'user_id, endpoint' });

    if (dbError) {
      console.error('Erreur sauvegarde abonnement push:', dbError);
      return { success: false, error: "Erreur base de données" };
    }

    return { success: true };
  } catch (err) {
    console.error('Erreur lors de l\'abonnement push:', err);
    if (Notification.permission === 'denied') {
      return { success: false, error: "Permissions de notifications refusées" };
    }
    return { success: false, error: err.message };
  }
}
