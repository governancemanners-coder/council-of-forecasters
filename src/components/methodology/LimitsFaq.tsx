import { motion } from 'framer-motion';
import { BookOpen, Scale, Dices, UserX } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EASE } from '@/components/methodology/ease';
import { SectionHead } from '@/components/methodology/common';

const DISCLAIMERS = [
  {
    icon: BookOpen,
    title: 'Educational tool.',
    body: 'This is a rehearsal, not a ruling. It teaches how the sector’s interests collide; it does not certify outcomes.',
  },
  {
    icon: Scale,
    title: 'Not legal advice.',
    body: 'The constraint layer is a simplification. Before any real action: real counsel, real statutes, real meetings.',
  },
  {
    icon: Dices,
    title: 'Deterministic, not prophetic.',
    body: 'Same seed, same transcript. The model encodes judgment calls — ours — and judgment calls can be wrong. The value is in the reasoning it forces, not the number it prints.',
  },
  {
    icon: UserX,
    title: 'No real persons.',
    body: 'Every seat is an institutional archetype. No statement on this site is attributable to any real organization — CHFT, CHF Canada, CMHC, the City, MMAH, and others appear as roles, not as endorsements or representations.',
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Why exactly twelve agents?',
    a: 'Because MiroFish’s insight isn’t the number, it’s the structure: personas, preferences, propagation, report. Twelve is small enough that you can predict what a seat will say, then be surprised by how the room moves it. That’s where the learning lives.',
  },
  {
    q: 'Is this affiliated with MiroFish?',
    a: 'No. It’s an independent homage — concepts credited, code original, and the credit stays visible in the footer of every page.',
  },
  {
    q: 'Why a caucus chat for the UI?',
    a: 'Because a deliberation you can scroll beats a dashboard you have to decode. The chat format is publicly familiar, and it maps naturally onto rounds, statements, and reactions.',
  },
  {
    q: 'Can the Council be wrong?',
    a: 'Constantly, in both directions. Treat any forecast as a structured argument to argue with.',
  },
  {
    q: 'Does my data leave my browser?',
    a: 'No. Seeds, runs, and reports live in your session. There is no backend.',
  },
  {
    q: 'Can I use this for my real co-op decision?',
    a: 'Use it to prepare, never to decide. Then bring the transcript — and a lawyer — to the real room.',
  },
];

/** 07 LIMITS & DISCLAIMERS — 2×2 card grid on a paper-deep band. */
export function LimitsSection() {
  return (
    <section id="limits" className="mt-24 scroll-mt-24 rounded-2xl bg-paper-deep px-6 py-12 md:px-10">
      <SectionHead index="07" eyebrow="LIMITS & DISCLAIMERS" title="What this is not." />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {DISCLAIMERS.map((d, i) => (
          <motion.div
            key={d.title}
            className="rounded-xl border border-gray-200 bg-surface p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
          >
            <d.icon size={20} className="text-council" aria-hidden />
            <h3 className="mt-3 font-display text-xl font-medium text-ink">{d.title}</h3>
            <p className="mt-2 text-sm leading-[22px] text-ink-soft">{d.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/** 08 FAQ — six-item accordion. */
export function FaqSection() {
  return (
    <section id="faq" className="mt-24 scroll-mt-24">
      <SectionHead index="08" eyebrow="FAQ" title="Asked, answered." />
      <motion.div
        className="mt-8 rounded-xl border border-gray-200 bg-surface px-6 max-md:px-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Accordion type="single" collapsible>
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="py-5 hover:no-underline">
                <span className="text-left font-display text-lg font-medium leading-6 text-ink">
                  {item.q}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <p className="max-w-[560px] text-sm leading-[22px] text-ink-soft">{item.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
