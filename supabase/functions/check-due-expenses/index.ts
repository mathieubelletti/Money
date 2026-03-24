import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.4";

// Récupération des clés secrètes injectées
webpush.setVapidDetails(
  'mailto:support@votre-app.com', // Remplacez par votre mail !
  Deno.env.get('VAPID_PUBLIC_KEY') || 'BCKAoSG40WxuelI_2OI-xJlnesudqyW0fbzCQXY35EFi8s9Gg-5iflL_dyf_CvJCBEVT6syMTdSmDY0_q-r3zFM',
  Deno.env.get('VAPID_PRIVATE_KEY') || '2FxPqRwHcuJseTwSXFP6MyWQWU_XZcEn3PiOG2gOCPo'
);

serve(async (req) => {
  try {
    // 1. Initialiser le client Supabase avec la clé Service Role (contourne le RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Récupérer toutes les données des dépenses fixes (globalRecurrences)
    const { data: usersState, error: stateError } = await supabaseClient
      .from('app_state')
      .select('user_id, value')
      .eq('key', 'globalRecurrences');

    if (stateError) throw stateError;

    // Jour du mois (1 à 31)
    const today = new Date();
    const currentDay = today.getDate(); // On peut aussi chercher currentDay + 1 pour "demain"
    
    // Pour chaque utilisateur
    for (const state of usersState) {
      const recurrences = state.value;
      if (!recurrences || !recurrences.fixes) continue;

      // Chercher si un prélèvement a lieu aujourd'hui (ou au pire demain)
      const dueExpenses = recurrences.fixes.filter((exp: any) => {
        return exp.day && parseInt(exp.day, 10) === currentDay;
      });

      if (dueExpenses.length > 0) {
        // L'utilisateur a une ou plusieurs dépenses prévues aujourd'hui
        console.log(`Dépense prévue aujourd'hui pour l'utilisateur ${state.user_id}`);

        // 3. Récupérer l'abonnement Push Web de cet utilisateur
        const { data: subs, error: subError } = await supabaseClient
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', state.user_id);

        if (subError) {
          console.error("Erreur req subscriptions", subError);
          continue;
        }

        // Envoyer la notification à tous les appareils enregistrés de cet utilisateur
        for (const sub of subs) {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          const expenseNames = dueExpenses.map((e: any) => e.label).join(', ');
          const payload = JSON.stringify({
            title: 'Échéance aujourd\'hui !',
            body: `Prélèvement prévu pour : ${expenseNames}`,
            url: '/'
          });

          try {
            await webpush.sendNotification(pushSubscription, payload);
          } catch (e: any) {
            console.error('Erreur sendNotification:', e.statusCode, e.body);
            // Si le token est expiré ou refusé (410), le supprimer de la BD
            if (e.statusCode === 410 || e.statusCode === 404) {
              await supabaseClient.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
