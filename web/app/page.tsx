import { Hero } from "@/components/sections/Hero/Hero";
import { Spellbook } from "@/components/sections/Spellbook/Spellbook";
import { HowItWorks } from "@/components/sections/HowItWorks/HowItWorks";
import { GoblinMesh } from "@/components/sections/GoblinMesh/GoblinMesh";
import { Stats } from "@/components/sections/Stats/Stats";
import { Marquee } from "@/components/sections/Marquee/Marquee";
import { IndexNow } from "@/components/sections/IndexNow/IndexNow";
import { Services } from "@/components/sections/Services/Services";
import { Pricing } from "@/components/sections/Pricing/Pricing";
import { Faq } from "@/components/sections/Faq/Faq";
import { Contact } from "@/components/sections/Contact/Contact";

// All page content ported — full render order.
const HomePage = () => (
  <div className="os" id="top">
    <Hero />
    <Spellbook />
    <HowItWorks />
    <GoblinMesh />
    <Stats />
    <Marquee />
    <IndexNow />
    <Services />
    <Pricing />
    <Faq />
    <Contact />
  </div>
);

export default HomePage;
