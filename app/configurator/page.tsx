import type { Metadata } from "next";
import { ConfiguratorPage } from "@/components/configurator/ConfiguratorPage";

export const metadata: Metadata = {
  title: "Honda ADV 150 Configurator | LetsCustomize",
  description: "Customize your Honda ADV 150 fairing colors in 3D",
};

export default function Page() {
  return <ConfiguratorPage />;
}
