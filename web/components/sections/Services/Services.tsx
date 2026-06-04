import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { ServiceAccordion } from "./ServiceAccordion";
import { SERVICES } from "./services.data";

export const Services = () => (
  <Panel id="services" cursor="./services">
    <PanelBar command="$ man goblin" note="six services · one goblin" />
    <ServiceAccordion services={SERVICES} />
  </Panel>
);
