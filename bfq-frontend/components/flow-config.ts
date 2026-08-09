import type { ParticipantRole } from "@/types/domain";

export type FlowPage = {
  slug: string;
  href: string;
  step: string;
  title: string;
  description: string;
  icon?: string;
  allowedRoles?: ParticipantRole[];
};

export const flowPages: FlowPage[] = [
  {
    slug: "identity",
    href: "/",
    step: "01",
    title: "Identity / Access",
    description: "Choose demo identity and establish verified institutional role.",
    allowedRoles: ["exporter", "buyer", "qualityInspector", "custodian", "marketMaker", "regulator", "auditor"],
  },
  {
    slug: "lots",
    href: "/lots",
    step: "02",
    title: "Coffee Lots",
    description: "Exporter lot registry, tokenized inventory and issuance readiness.",
    allowedRoles: ["exporter", "qualityInspector", "custodian", "auditor", "regulator"],
  },
  {
    slug: "verification",
    href: "/lots/LOT-ETH-042",
    step: "03",
    title: "Asset Verification",
    description: "Physical coffee → verified data → tokenized asset provenance.",
    allowedRoles: ["exporter", "qualityInspector", "custodian", "buyer", "auditor", "regulator"],
  },
  {
    slug: "marketplace",
    href: "/marketplace",
    step: "04",
    title: "Marketplace",
    description: "Discover verified tokenized coffee lots available for RFQ.",
    allowedRoles: ["buyer", "exporter", "marketMaker", "auditor"],
  },
  {
    slug: "rfq",
    href: "/rfq",
    step: "05",
    title: "RFQ Workspace",
    description: "Create request, view competitive maker quotes, and accept best offer.",
    allowedRoles: ["buyer", "marketMaker", "exporter", "auditor"],
  },
  {
    slug: "settlement",
    href: "/settlement",
    step: "06",
    title: "Settlement",
    description: "Pre-trade Cleanverse CCP compliance check and atomic settlement.",
    allowedRoles: ["buyer", "exporter", "marketMaker", "regulator", "auditor"],
  },
  {
    slug: "audit",
    href: "/audit",
    step: "07",
    title: "Audit History",
    description: "Historical trade audit trail, Travel Rule, and Monadscan records.",
    allowedRoles: ["exporter", "buyer", "qualityInspector", "custodian", "marketMaker", "regulator", "auditor"],
  },
];

export const shellRoles = [
  "exporter",
  "buyer",
  "marketMaker",
  "qualityInspector",
  "custodian",
  "regulator",
  "auditor",
] as const;
