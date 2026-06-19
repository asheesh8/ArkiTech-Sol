import type { EmailType } from './types';

interface TemplateContext {
  ownerName: string;
  businessName: string;
  service?: string;
  amount?: number;
}

export function buildEmailTemplate(type: EmailType, context: TemplateContext) {
  const owner = context.ownerName || 'there';
  const templates = {
    follow_up: { subject: `Quick follow-up for ${context.businessName}`, body: `Hey ${owner}, just circling back after we spoke. I pulled the review gap for ${context.businessName} and would be glad to walk you through the easiest first move.` },
    proposal: { subject: `A proposal for ${context.businessName}`, body: `Hi ${owner}, we'd love to propose ${context.service || 'a focused growth system'} for ${context.businessName}. I kept the scope clear, measurable, and tied to proof.` },
    check_in: { subject: `Quick check-in — ${context.businessName}`, body: `Hi ${owner}, quick check in — how are things going? We’re reviewing the latest account movement and wanted to make sure the next priority is aligned.` },
    invoice: { subject: `Invoice for ${context.businessName}`, body: `Hi ${owner}, here's your invoice for $${context.amount ?? 0}. Reply here if you want us to walk through anything before the due date.` },
    free_trial: { subject: `Your 30-day ArkiTech trial starts today`, body: `Hi ${owner}, your 30-day free trial for ${context.businessName} starts today. We’ll monitor reviews, tighten the Google profile, and show you the delta at the end.` },
    custom: { subject: '', body: '' },
  } satisfies Record<EmailType, { subject: string; body: string }>;
  return templates[type];
}
