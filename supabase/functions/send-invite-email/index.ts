import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface InviteEmailRequest {
  email: string;
  token: string;
  unit_label: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, unit_label }: InviteEmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Configuração de email não encontrada" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const inviteUrl = `${Deno.env.get("VITE_SUPABASE_URL")}/auth/v1/verify?token=${token}&type=invite&redirect_to=${encodeURIComponent(window.location.origin)}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EASY Gestão <onboarding@resend.dev>",
        to: [email],
        subject: "Convite para acessar o EASY Gestão",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Você foi convidado!</h1>
            <p>Você foi convidado para acessar o sistema EASY Gestão como morador da unidade <strong>${unit_label}</strong>.</p>
            <p>Para criar sua conta, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Criar Minha Conta
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Este convite expira em 7 dias.</p>
            <p style="color: #666; font-size: 14px;">Se você não solicitou este convite, pode ignorar este email.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Erro ao enviar email:", error);
      throw new Error("Falha ao enviar email");
    }

    const data = await res.json();
    console.log("Email enviado com sucesso:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
