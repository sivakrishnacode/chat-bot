// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const spaceSolarNodes = [
  {
    key: "welcome_helio",
    isStart: true,
    title: "Welcome — Helio",
    message:
      "Welcome to SpaceSolar — Powering tomorrow.\nHi, I'm Helio 🌞. How can I help you today?",
    replies: ["Locate Nearby Dealers", "Products", "How-to & DIY", "Raise Ticket"],
    targets: ["dealers", "products", "howto", "raise_ticket"],
  },
  {
    key: "dealers",
    title: "Locate Dealers",
    message:
      "Share your PIN code or tap Share Location so we can find nearby SpaceSolar dealers.",
    replies: ["Send PIN Code", "Share Location", "Back to Menu"],
    targets: ["dealers_pin", "dealers_location", "back_to_menu"],
  },
  {
    key: "dealers_pin",
    title: "Dealers — By PIN",
    message: "Please type your 6-digit PIN code.\nExample: 560001",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "dealers_location",
    title: "Dealers — Share Location",
    message:
      "Nearest dealers found:\n1. SpaceSolar Dealer — MG Road — 1.2 km\n2. SolarPoint — Koramangala — 2.8 km",
    replies: ["View on Map", "Back to Menu"],
    targets: ["view_map", "back_to_menu"],
  },
  {
    key: "view_map",
    title: "View Map",
    message: "🗺️ Open in Maps: https://maps.app.goo.gl/example",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "products",
    title: "Products",
    message: "Our product categories — choose to explore:",
    replies: ["Solar Panels", "Inverters", "Batteries", "Accessories", "Back"],
    targets: ["prod_panels", "prod_inverters", "prod_batteries", "prod_accessories", "back_to_menu"],
  },
  {
    key: "prod_panels",
    title: "Solar Panels",
    message:
      "☀️ Solar Panels — Mono & PERC options.\nEfficiency: 20%+, 25-year performance warranty.",
    replies: ["Catalog", "Speak to Sales", "Back"],
    targets: ["catalog_panels", "sales", "products"],
  },
  {
    key: "prod_inverters",
    title: "Inverters",
    message: "⚡ Inverters — String & Hybrid. Smart monitoring built-in.",
    replies: ["Catalog", "Speak to Sales", "Back"],
    targets: ["catalog_inverters", "sales", "products"],
  },
  {
    key: "prod_batteries",
    title: "Batteries",
    message: "🔋 Batteries — Lithium & VRLA. Backup hours depend on config.",
    replies: ["Catalog", "Speak to Sales", "Back"],
    targets: ["catalog_batteries", "sales", "products"],
  },
  {
    key: "prod_accessories",
    title: "Accessories",
    message: "🔧 Accessories — Mounting, cables, MC4 connectors, AC DBs.",
    replies: ["Catalog", "Speak to Sales", "Back"],
    targets: ["catalog_accessories", "sales", "products"],
  },
  {
    key: "catalog_panels",
    title: "Catalog — Panels",
    message: "📄 Panels Catalog PDF → https://example.com/catalog-panels.pdf\n\nWould you like to request a quote?",
    replies: ["Request Quote", "Back"],
    targets: ["request_quote", "products"],
  },
  {
    key: "catalog_inverters",
    title: "Catalog — Inverters",
    message: "📄 Inverters Catalog PDF → https://example.com/catalog-inverters.pdf\n\nWould you like a quote?",
    replies: ["Request Quote", "Back"],
    targets: ["request_quote", "products"],
  },
  {
    key: "catalog_batteries",
    title: "Catalog — Batteries",
    message: "📄 Batteries Catalog PDF → https://example.com/catalog-batteries.pdf\n\nWould you like a quote?",
    replies: ["Request Quote", "Back"],
    targets: ["request_quote", "products"],
  },
  {
    key: "catalog_accessories",
    title: "Catalog — Accessories",
    message: "📄 Accessories Catalog → https://example.com/catalog-accessories.pdf\n\nWould you like a quote?",
    replies: ["Request Quote", "Back"],
    targets: ["request_quote", "products"],
  },
  {
    key: "request_quote",
    title: "Request Quote",
    message:
      "Please share:\n• Product code or name\n• Your PIN code\n• Preferred contact number\n\nExample: Panel P123, 560001, +91-98XXXXXXXX",
    replies: ["Submit", "Back to Menu"],
    targets: ["quote_submitted", "back_to_menu"],
  },
  {
    key: "quote_submitted",
    title: "Quote Submitted",
    message:
      "✅ Your quote request has been submitted!\nOur sales team will contact you within 24 hours.",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "howto",
    title: "How-to & DIY",
    message: "📚 How-to resources — choose a topic:",
    replies: ["Installation Tips", "Maintenance", "Troubleshooting", "Back to Menu"],
    targets: ["how_install", "how_maint", "how_troubleshoot", "back_to_menu"],
  },
  {
    key: "how_install",
    title: "Installation Tips",
    message:
      "🔧 Tips:\n• South-facing orientation gives best output\n• Avoid shading\n\n▶️ Watch: https://youtu.be/example_install",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "how_maint",
    title: "Maintenance",
    message:
      "🧹 Maintenance:\n• Clean panels monthly\n• Check connections quarterly\n\n▶️ Watch: https://youtu.be/example_maint",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "how_troubleshoot",
    title: "Troubleshooting",
    message:
      "🔍 DIY Troubleshooting:\n• Low output checks\n• Inverter error codes\n\n▶️ Playlist: https://youtube.com/playlist?list=example",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "raise_ticket",
    title: "Raise Ticket",
    message:
      "📝 Describe your issue and share your order ID or customer number if available.",
    replies: ["Submit Issue", "Speak to Agent", "Back to Menu"],
    targets: ["ticket_submit", "sales", "back_to_menu"],
  },
  {
    key: "ticket_submit",
    title: "Ticket — Capture",
    message: 'Please type your issue now.\nExample: "Inverter error E01 — under warranty"',
    replies: ["Confirm & Submit", "Back to Menu"],
    targets: ["ticket_confirm", "back_to_menu"],
  },
  {
    key: "ticket_confirm",
    title: "Ticket Submitted",
    message:
      "✅ Ticket logged!\nTicket ID: TS-2025-001\nOur support team will reach out within 24 hours.",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "sales",
    title: "Sales Contact",
    message:
      "👤 A sales representative will contact you.\nShare your best contact number or tap Call Sales.",
    replies: ["Call Sales", "Back to Menu"],
    targets: ["call_sales", "back_to_menu"],
  },
  {
    key: "call_sales",
    title: "Call Sales",
    message: "📞 Call us: tel:+911234567890",
    replies: ["Back to Menu"],
    targets: ["back_to_menu"],
  },
  {
    key: "back_to_menu",
    title: "Back to Menu",
    message: "Returning to main menu…",
    replies: ["Main Menu"],
    targets: ["welcome_helio"],
  },
];

async function main() {
  const client = await prisma.client.create({
    data: {
      name: "SpaceSolar",
      industry: "Solar Energy",
      email: "contact@spacesolar.in",
      flows: {
        create: {
          name: "SpaceSolar Support Bot",
          description: "Product enquiry, dealer locator, support tickets, and quotes.",
          nodes: {
            create: spaceSolarNodes,
          },
        },
      },
    },
  });

  console.log(`✅ Seeded client: ${client.name} (${client.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
