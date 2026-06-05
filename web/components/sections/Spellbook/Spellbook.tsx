import { Panel } from "@/components/ui/Panel/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { SpriteFire, SpriteIce, SpriteLightning } from "@/components/ui/Sprite";
import styles from "./Spellbook.module.css";

type SpellIcon = "fire" | "bolt" | "ice";
type Spell = { icon: SpellIcon; name: string; level: string; sub: string };

const SPELLS: Spell[] = [
  {
    icon: "fire",
    name: "AEO",
    level: "answer-engine visibility",
    sub: "Get cited inside ChatGPT, Claude, Gemini, Perplexity & AI Overviews.",
  },
  {
    icon: "bolt",
    name: "SEO",
    level: "technical foundation",
    sub: "Crawl, index, schema, Core Web Vitals. The base AEO stands on.",
  },
  {
    icon: "ice",
    name: "A11Y",
    level: "WCAG 2.1 AA + Section 508",
    sub: "Accessible to people and parseable by machines. Required for gov.",
  },
];

const SpellIcon = ({ icon }: { icon: SpellIcon }) => {
  if (icon === "fire") return <SpriteFire size={4} />;
  if (icon === "ice") return <SpriteIce size={4} />;
  return <SpriteLightning size={4} />;
};

export const Spellbook = () => (
  <Panel className={styles.section} cursor="./spellbook">
    <Reveal className={styles.spellbook}>
      <div className={styles.head}>
        <span className={styles.title}>Visibility Spellbook</span>
        <span className={styles.count}>3 schools · 1 goblin</span>
      </div>
      <div className={styles.cards}>
        {SPELLS.map((spell) => (
          <div className={styles.card} key={spell.name}>
            <div className={styles.icon}>
              <SpellIcon icon={spell.icon} />
            </div>
            <div>
              <div className={styles.name}>{spell.name}</div>
              <div className={styles.level}>{spell.level}</div>
              <div className={styles.sub}>{spell.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.foot}>
        <span className={styles.path}>&gt; one stack: get found, stay legible, stay compliant</span>
        <span className={styles.version}>v2</span>
      </div>
    </Reveal>
  </Panel>
);
