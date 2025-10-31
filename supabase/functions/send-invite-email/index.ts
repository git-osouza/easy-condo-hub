import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface InviteEmailRequest {
  email: string;
  unit_label: string;
  unit_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, unit_label, unit_id }: InviteEmailRequest = await req.json();

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada");
      return new Response(
        JSON.stringify({ error: "Configuração de email não encontrada" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🟢 Cria convite real no Supabase Auth
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: "https://easy-condo-hub.lovable.app/",
    });

    if (error) {
      console.error("Erro ao criar convite Supabase:", error);
      throw new Error("Falha ao criar convite Supabase");
    }

    const inviteUrl = data?.action_link;
    if (!inviteUrl) {
      throw new Error("Link de convite não retornado pelo Supabase");
    }

    console.log(`Convite gerado para ${email}, unidade: ${unit_label}`);

    // 🟢 Envio de e-mail via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "EASY Portaria <onboarding@resend.dev>",
        to: [email],
        subject: "Convite para criar conta no EASY",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0ea5a0 0%, #0d8f8b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">EASY</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Gestão para Portarias</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Bem-vindo ao EASY!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Você foi convidado para criar uma conta no sistema EASY de gestão de portarias.
              </p>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Sua unidade:</p>
                <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 18px; font-weight: bold;">${unit_label}</p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Para criar sua senha e acessar o sistema, clique no botão abaixo:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="background: linear-gradient(135deg, #0ea5a0 0%, #0d8f8b 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          font-size: 16px;
                          display: inline-block;">
                  Criar Minha Conta
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Se você não solicitou este convite, pode ignorar este email com segurança.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                Ou copie e cole este link no seu navegador:<br>
                <span style="word-break: break-all; color: #0ea5a0;">${inviteUrl}</span>
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">EASY - Gestão para Portarias</p>
              <p style="margin: 5px 0 0 0;">Sistema de gestão inteligente para condomínios</p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro ao enviar email:", errorText);
      throw new Error("Falha ao enviar email");
    }

    const emailResponse = await res.json();
    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
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
