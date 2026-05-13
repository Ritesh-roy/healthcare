import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, Mail, Phone, BookOpen, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/help")({ component: HelpPage });

const FAQS = [
  {
    q: "How do I create a new referral?",
    a: "Click the New referral button in the top bar, or press N anywhere in Refera. Complete the four-step wizard — patient, clinical detail, specialty, review — and submit. The receiving specialist is notified instantly.",
  },
  {
    q: "Who can see a patient's referral?",
    a: "Only the referring clinician, the assigned specialist team and authorised practice staff. All access is recorded in the tamper-evident audit log under Settings → Security & audit.",
  },
  {
    q: "Can I attach investigations and documents?",
    a: "Yes. The referral wizard accepts PDFs, DICOM previews and lab results up to 25 MB per file. Attachments are encrypted at rest and in transit.",
  },
  {
    q: "How are urgent referrals handled?",
    a: "Marking a referral as Urgent triggers an SMS to the on-call specialist, escalates the item in the triage queue and starts a 24-hour acknowledgement timer.",
  },
  {
    q: "Is Refera HIPAA and GDPR compliant?",
    a: "Refera is built against HIPAA, GDPR and NHS DSP Toolkit controls — including AES-256 encryption, role-based access, audit logging and data residency in the EU/UK.",
  },
];

function HelpPage() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Help & support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Answers, guides and direct lines to our clinical support team.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <ContactCard
            icon={<Mail className="h-5 w-5" />}
            title="Email support"
            value="support@refera.health"
            description="Replies within 2 hours, 24/7."
            action={<Button asChild variant="outline" size="sm"><a href="mailto:support@refera.health">Send email</a></Button>}
          />
          <ContactCard
            icon={<Phone className="h-5 w-5" />}
            title="Clinical hotline"
            value="+44 20 4538 9912"
            description="Mon–Sun · 06:00–22:00 GMT."
            action={<Button asChild variant="outline" size="sm"><a href="tel:+442045389912">Call now</a></Button>}
          />
          <ContactCard
            icon={<MessageSquare className="h-5 w-5" />}
            title="Live chat"
            value="In-app messenger"
            description="Median response under 90 seconds."
            action={<Button asChild variant="outline" size="sm"><Link to="/settings" search={{ tab: "profile" }}>Open chat</Link></Button>}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Frequently asked questions</CardTitle>
            <CardDescription>The fastest way to get unstuck.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`f-${i}`}>
                  <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-gradient-subtle">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6">
            <div className="h-10 w-10 rounded-lg bg-primary/15 grid place-items-center text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Need a workspace migration or onboarding?</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Our implementation team will move existing referral workflows into Refera in under two weeks.
              </div>
            </div>
            <Button asChild><a href="mailto:onboarding@refera.health">Talk to onboarding</a></Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function ContactCard({ icon, title, value, description, action }: { icon: React.ReactNode; title: string; value: string; description: string; action: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="h-9 w-9 rounded-md bg-accent grid place-items-center text-muted-foreground">{icon}</div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-sm text-foreground mt-0.5">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}