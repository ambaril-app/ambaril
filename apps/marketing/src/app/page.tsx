import { Hero } from "@/components/hero";
import { TransitionBand } from "@/components/transition-band";
import { FeatureSection } from "@/components/feature-section";
import { CtaSection } from "@/components/cta-section";
import { WarRoomMockup } from "@/components/mockups/war-room-mockup";
import { CrmMockup } from "@/components/mockups/crm-mockup";
import { AiMockup } from "@/components/mockups/ai-mockup";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <TransitionBand />

      {/* 1 — Intelligence (War Room + Market Intel consolidados) */}
      <FeatureSection
        anchor="War Room · Beacon · Intelligence de Mercado"
        title="Monitora tudo. Você só toma a decisão."
        body="GMV, margem, estoque e campanhas — e o que seus concorrentes estão fazendo. Tudo em tempo real, tudo classificado por prioridade. Quando algo importa, o sistema avisa. Antes de você precisar procurar."
        mockup={<WarRoomMockup />}
      />

      {/* 2 — CRM */}
      <FeatureSection
        flip
        anchor="CRM · RFM · Automação de ciclo de vida"
        title="Reativa seus clientes sem você precisar pedir."
        body="RFM calculado automaticamente. Clientes em risco de churn sinalizados antes de irem embora. Quando chega a hora, o agente dispara a campanha no WhatsApp ou email. Você vê o resultado no painel."
        mockup={<CrmMockup />}
      />

      {/* 3 — ClawdBot (dark — sustenta o clima antes do CTA) */}
      <FeatureSection
        dark
        anchor="ClawdBot · IA nativa · Telegram · Discord · Slack"
        title="Você pergunta. O agente responde com dados do seu negócio."
        body="Digite no Telegram: 'Quais produtos estão caindo em conversão?' O agente analisa e te diz o próximo passo. Relatório automático às 8h. Alertas quando algo importa. Não é chatbot — é um operador digital."
        mockup={<AiMockup />}
      />

      <CtaSection />
    </main>
  );
}
