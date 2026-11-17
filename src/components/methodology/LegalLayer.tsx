import { useState } from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTypewriter } from '@/components/report/useTypewriter';
import { EASE } from '@/components/methodology/ease';
import { SectionHead } from '@/components/methodology/common';

interface Framework {
  id: string;
  name: string;
  governs: string;
  trigger: string;
  source: string;
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'cca',
    name: 'Co-operative Corporations Act (Ontario)',
    governs:
      'The co-op’s constitution: incorporation, governance, director duties, member meetings and special resolutions. Anything that changes what the co-op is — a disposition, a fundamental restructuring — lives here.',
    trigger: 'TRIGGER: disposition or fundamental change without required member/ministerial approval.',
    source: 'ontario.ca/laws',
  },
  {
    id: 'rta',
    name: 'Residential Tenancies Act (Ontario)',
    governs:
      'Since 2014, non-profit housing co-op evictions run through the Landlord and Tenant Board under Part V.1. The old sheriff’s-notice world is gone; process is mandatory.',
    trigger: 'TRIGGER: eviction/arrears enforcement bypassing LTB process.',
    source: 'ontario.ca/laws; tribunalsontario.ca/ltb',
  },
  {
    id: 'hrc',
    name: 'Ontario Human Rights Code',
    governs:
      'Freedom from discrimination in housing, and the duty to accommodate. Occupancy and intake rules are where co-ops most often brush against it.',
    trigger: 'TRIGGER: occupancy/intake rules with differential impact on Code-protected grounds.',
    source: 'ohrc.on.ca',
  },
  {
    id: 'nhs',
    name: 'National Housing Strategy Act (Canada)',
    governs:
      'Commits Canada to the progressive realization of the right to adequate housing, and establishes the National Housing Council and the Federal Housing Advocate to watch over it.',
    trigger: 'TRIGGER: net loss of affordable units without replacement.',
    source: 'laws-lois.justice.gc.ca',
  },
  {
    id: 'cescr',
    name: 'UN CESCR Article 11 & Special Rapporteur guidance',
    governs:
      'The international right to adequate housing: security of tenure, affordability, no forced eviction. The moral floor under everything else on this list.',
    trigger: 'TRIGGER: displacement without adequate alternatives.',
    source: 'ohchr.org',
  },
];

/** Trigger line that types on (12ms/char) when its panel opens. */
function TriggerLine({ text, active }: { text: string; active: boolean }) {
  const { typed } = useTypewriter(text, 12, active);
  return (
    <p className="mono-data min-h-10 rounded-lg bg-[#FBEBEB]/60 px-3 py-2 text-[13px] leading-5 text-veto" aria-label={text}>
      {typed}
    </p>
  );
}

/**
 * 05 THE LEGAL LAYER — five frameworks as a shadcn accordion: what each
 * governs, the engine's simplified trigger (mono, veto text), and a source.
 */
export default function LegalLayer() {
  const [open, setOpen] = useState<string[]>([]);

  return (
    <section id="legal" className="mt-24 scroll-mt-24">
      <SectionHead index="05" eyebrow="THE LEGAL LAYER" title="Five frameworks, hard-coded.">
        <p>
          The constraint layer is what makes this a housing-co-op simulator instead of a generic
          opinion machine. These are the frameworks the engine encodes, in simplified rule form.
        </p>
      </SectionHead>

      <motion.div
        className="mt-8 rounded-xl border border-gray-200 bg-surface px-6 max-md:px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Accordion type="multiple" value={open} onValueChange={setOpen}>
          {FRAMEWORKS.map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger className="py-5 hover:no-underline">
                <span className="text-left font-display text-lg font-medium leading-6 text-ink">
                  {f.name}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <p className="text-sm leading-[22px] text-ink-soft">{f.governs}</p>
                <div className="mt-3">
                  <TriggerLine text={f.trigger} active={open.includes(f.id)} />
                </div>
                <p className="mono-label mt-3 text-[10px] text-gray-500">SOURCE: {f.source}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>

      <p className="mt-6 text-base leading-[26px] text-ink-soft">
        Triggers are deliberately conservative simplifications. The point of the layer is to teach
        where the walls are, not to certify that a real action clears them.
      </p>
    </section>
  );
}
