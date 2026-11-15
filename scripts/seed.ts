import { config } from "dotenv";
import { extraSubs, toSlug } from "./subcategory-data";

config({ path: ".env.local" });
config();

const makes = ["Toyota", "Honda", "Ford", "BMW", "Tesla", "Other"];

const catalog = [
  {
    name: "Jobs",
    slug: "jobs",
    icon: "Briefcase",
    subs: [
      { name: "Full Time", slug: "full-time", fields: [{ key: "compensation", label: "Compensation", type: "text", options: [], required: false, filterable: true }] },
      { name: "Part Time", slug: "part-time", fields: [{ key: "compensation", label: "Compensation", type: "text", options: [], required: false, filterable: true }] },
      { name: "Contract", slug: "contract", fields: [{ key: "compensation", label: "Compensation", type: "text", options: [], required: false, filterable: true }] },
      { name: "Gig", slug: "gig", fields: [{ key: "compensation", label: "Compensation", type: "text", options: [], required: false, filterable: true }] },
    ],
  },
  {
    name: "Vehicles",
    slug: "vehicles",
    icon: "Car",
    subs: [
      { name: "Cars", slug: "cars", fields: [
        { key: "year", label: "Year", type: "number", options: [], required: true, filterable: true },
        { key: "make", label: "Make", type: "select", options: makes, required: true, filterable: true },
        { key: "model", label: "Model", type: "text", options: [], required: true, filterable: true },
        { key: "mileage", label: "Mileage", type: "number", options: [], required: false, filterable: true },
      ] },
      { name: "Motorcycles", slug: "motorcycles", fields: [
        { key: "year", label: "Year", type: "number", options: [], required: false, filterable: true },
        { key: "make", label: "Make", type: "text", options: [], required: false, filterable: true },
      ] },
      { name: "Trucks", slug: "trucks", fields: [
        { key: "year", label: "Year", type: "number", options: [], required: false, filterable: true },
        { key: "make", label: "Make", type: "select", options: makes, required: false, filterable: true },
      ] },
      { name: "Parts", slug: "parts", fields: [{ key: "part", label: "Part", type: "text", options: [], required: false, filterable: false }] },
    ],
  },
  {
    name: "Items for Sale",
    slug: "items-for-sale",
    icon: "ShoppingBag",
    subs: [
      { name: "Electronics", slug: "electronics", fields: [{ key: "condition", label: "Condition", type: "select", options: ["New", "Used", "Refurbished"], required: false, filterable: true }] },
      { name: "Furniture", slug: "furniture", fields: [{ key: "condition", label: "Condition", type: "select", options: ["New", "Used"], required: false, filterable: true }] },
      { name: "Clothing", slug: "clothing", fields: [{ key: "size", label: "Size", type: "text", options: [], required: false, filterable: true }] },
      { name: "Free Stuff", slug: "free-stuff", fields: [] },
    ],
  },
  {
    name: "Pets",
    slug: "pets",
    icon: "PawPrint",
    subs: [
      { name: "Dogs", slug: "dogs", fields: [{ key: "breed", label: "Breed", type: "text", options: [], required: false, filterable: true }] },
      { name: "Cats", slug: "cats", fields: [{ key: "breed", label: "Breed", type: "text", options: [], required: false, filterable: true }] },
      { name: "Other Pets", slug: "other-pets", fields: [{ key: "species", label: "Species", type: "text", options: [], required: false, filterable: true }] },
      { name: "Pet Supplies", slug: "pet-supplies", fields: [] },
    ],
  },
  {
    name: "Real Estate",
    slug: "real-estate",
    icon: "Home",
    subs: ["Houses", "Condos", "Land", "Commercial"].map((name) => ({
      name,
      slug: name.toLowerCase(),
      fields: name === "Land" ? [{ key: "sqft", label: "Sqft", type: "number", options: [], required: false, filterable: true }] : [
        { key: "beds", label: "Beds", type: "number", options: [], required: false, filterable: true },
        { key: "baths", label: "Baths", type: "number", options: [], required: false, filterable: true },
        { key: "sqft", label: "Sqft", type: "number", options: [], required: false, filterable: true },
      ],
    })),
  },
  {
    name: "For Rent",
    slug: "for-rent",
    icon: "KeyRound",
    subs: ["Apartments", "Houses", "Rooms", "Commercial"].map((name) => ({
      name,
      slug: name.toLowerCase(),
      fields: name === "Rooms" ? [{ key: "beds", label: "Beds", type: "number", options: [], required: false, filterable: true }] : [
        { key: "beds", label: "Beds", type: "number", options: [], required: false, filterable: true },
        { key: "baths", label: "Baths", type: "number", options: [], required: false, filterable: true },
        { key: "sqft", label: "Sqft", type: "number", options: [], required: false, filterable: true },
      ],
    })),
  },
  {
    name: "Services",
    slug: "services",
    icon: "Wrench",
    subs: ["Home Services", "Automotive", "Lessons", "Events"].map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, "-"), fields: [{ key: "rate", label: "Rate", type: "text", options: [], required: false, filterable: false }] })),
  },
  {
    name: "Community",
    slug: "community",
    icon: "Users",
    subs: ["Events", "Classes", "Volunteers", "Lost & Found"].map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), fields: [] })),
  },
];

for (const c of catalog) {
  const have = new Set(c.subs.map((x: { slug: string }) => x.slug));
  for (const name of extraSubs[c.slug] || []) {
    const slug = toSlug(name);
    if (have.has(slug)) continue;
    have.add(slug);
    (c.subs as unknown as { name: string; slug: string; fields: unknown[] }[]).push({ name, slug, fields: [] });
  }
}

const cities = [["Pondy", "Puducherry", "605001", 11.9416, 79.8083]] as const;

const titles = [
  "Weekend warehouse associate", "Hybrid customer support role", "Reliable commuter sedan", "Oak dining table", "Friendly adult lab mix",
  "Sunny 2-bed bungalow", "Furnished studio near transit", "Licensed plumber this week", "Neighborhood cleanup Saturday", "Mountain bike, tuned",
  "Part-time bakery closer", "Cargo van with racks", "Vintage camera bundle", "Calm indoor cat", "Corner condo with balcony",
  "Room in a quiet house", "Piano lessons for beginners", "Lost keys near the park", "Entry-level bookkeeper", "Family SUV, one owner",
  "Solid wood bookshelf", "Puppy training starter kit", "Half-acre lot, utilities nearby", "Apartment with a washer", "Mobile mechanic, evenings",
  "Volunteer tutors wanted", "Contract graphic designer", "Motorcycle helmet and jacket", "Kids winter coats", "Bonded pair of rabbits",
  "Downtown office suite", "Shared yard room", "Event photographer", "Found blue backpack", "Night auditor position",
  "Electric hatchback", "Desk lamp and chair", "Aquarium with stand", "Ranch house on a cul-de-sac", "Moving-day helpers",
];

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const samplePhotos: Record<string, [string, string][]> = {
  jobs: [
    ["https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80"],
  ],
  vehicles: [
    ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=1200&q=80"],
  ],
  "items-for-sale": [
    ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1200&q=80"],
  ],
  pets: [
    ["https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80"],
  ],
  "real-estate": [
    ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"],
  ],
  "for-rent": [
    ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"],
  ],
  services: [
    ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"],
  ],
  community: [
    ["https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80"],
    ["https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80"],
  ],
};

function sampleImages(categorySlug: string, index: number) {
  const sets = samplePhotos[categorySlug] || samplePhotos.community;
  const [first, second] = sets[index % sets.length];
  return [
    { url: first, publicId: "" },
    { url: second, publicId: "" },
  ];
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env.local before seeding.");
  if (!email || password.length < 8) throw new Error("Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 8 characters.");

  const bcryptModule = await import("bcryptjs");
  const bcrypt = "default" in bcryptModule ? bcryptModule.default : bcryptModule;
  const { dbConnect } = await import("../src/lib/db");
  const { User } = await import("../src/models/User");
  const { Category, SubCategory, Location, Keyword, ExpiryOption, ReportType, Page, Faq, Setting, Counter } = await import("../src/models/Catalog");
  const { Ad } = await import("../src/models/Ad");
  await dbConnect();

  const passwordHash = await bcrypt.hash(password, 12);
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({ name: "Super Admin", email, passwordHash, role: "superadmin", status: "active", emailVerified: true });
    console.log("Created superadmin", email);
  } else console.log("Superadmin already exists", email);

  const demoEmail = "demo.customer@classinest.local";
  if (!(await User.findOne({ email: demoEmail }))) {
    await User.create({
      name: "Demo Customer",
      email: demoEmail,
      phone: "+15551230000",
      passwordHash: await bcrypt.hash("Demo1234!", 12),
      role: "customer",
      status: "active",
      emailVerified: true,
    });
    console.log("Created demo customer", demoEmail, "password Demo1234!");
  }
  const customer = await User.findOne({ email: demoEmail });

  const categoryIds = new Map<string, string>();
  const subIds: { id: string; category: string; parent: string; slug: string; name: string }[] = [];
  for (const [index, category] of catalog.entries()) {
    const saved = await Category.findOneAndUpdate(
      { slug: category.slug },
      { name: category.name, slug: category.slug, icon: category.icon, order: index, isActive: true },
      { upsert: true, new: true },
    );
    categoryIds.set(category.slug, String(saved._id));
    for (const [subIndex, sub] of category.subs.entries()) {
      const subSaved = await SubCategory.findOneAndUpdate(
        { category: saved._id, slug: sub.slug },
        { category: saved._id, name: sub.name, slug: sub.slug, order: subIndex < 4 ? subIndex : 10 + subIndex, isActive: true, fields: sub.fields },
        { upsert: true, new: true },
      );
      subIds.push({ id: String(subSaved._id), category: String(saved._id), parent: category.slug, slug: sub.slug, name: sub.name });
    }
  }

  const locationIds: { id: string; city: string; state: string; zip: string }[] = [];
  for (const [city, state, zip, lat, lng] of cities) {
    const slug = slugify(city);
    const saved = await Location.findOneAndUpdate(
      { slug },
      { country: "India", state, city, zip, lat, lng, slug, isActive: true },
      { upsert: true, new: true },
    );
    locationIds.push({ id: String(saved._id), city, state, zip });
  }
  const pondyId = locationIds[0]?.id;
  if (pondyId) {
    await Ad.updateMany({}, { $set: { location: pondyId, city: "Pondy", zip: "605001" } });
    const sampleAds = await Ad.find({ adNumber: { $gte: 10001, $lte: 10040 } });
    for (const ad of sampleAds) {
      ad.description = String(ad.description).replace(/ in [^.]+\./, " in Pondy.");
      await ad.save();
    }
    await Location.deleteMany({ _id: { $ne: pondyId } });
  }

  const expiry = [
    ["1 week", 7], ["2 weeks", 14], ["3 weeks", 21], ["1 month", 30], ["3 months", 90], ["6 months", 180], ["9 months", 270],
  ];
  for (const [order, [label, days]] of expiry.entries()) {
    await ExpiryOption.findOneAndUpdate({ days }, { label, days, order, isDefault: days === 180, isActive: true }, { upsert: true });
  }
  const reports = ["harassment", "spam", "scam", "wrong_category", "terms_violation", "other"];
  for (const [order, key] of reports.entries()) {
    await ReportType.findOneAndUpdate({ key }, { key, label: key.replace(/_/g, " "), order, isActive: true }, { upsert: true });
  }
  for (const word of ["counterfeit", "stolen", "escort", "wire transfer only", "crypto doubler"]) {
    await Keyword.findOneAndUpdate({ word }, { word, isActive: true }, { upsert: true });
  }
  const pages = [
    ["about", "About AdWall", "AdWall is a local classifieds marketplace for people who want a calmer way to buy, sell, rent, and hire."],
    ["safety", "Safety and fraud tips", "Meet in public, inspect items before paying, and never send wire transfers or gift cards to a stranger."],
    ["terms", "Terms of use", "Post accurate ads, keep your account private, and follow the law. We may remove listings or block accounts that break these terms."],
    ["privacy", "Privacy", "Seller email addresses are hidden on public pages and used only to relay messages. We store account, ad, and security records to run the site."],
  ];
  for (const [order, [slug, title, content]] of pages.entries()) {
    await Page.findOneAndUpdate({ slug }, { slug, title, content, order, isActive: true }, { upsert: true });
  }
  const faqs = [
    ["How do I post an ad?", "Register, verify your email, then open Post a free ad. If moderation is on, the ad stays pending until an admin approves it."],
    ["Can a customer sign in to the admin panel?", "No. Customer accounts see “You do not have access to the admin panel” and do not receive an admin session."],
    ["Can an admin use the customer site?", "Yes. Admin and superadmin accounts can sign in at /login and at /admin/login with the same password."],
  ];
  for (const [order, [question, answer]] of faqs.entries()) {
    await Faq.findOneAndUpdate({ question }, { question, answer, order, isActive: true }, { upsert: true });
  }
  await Setting.findOneAndUpdate(
    { key: "site" },
    { key: "site", siteName: "AdWall", contactEmail: email, moderationEnabled: true, maxImages: 5 },
    { upsert: true },
  );

  if ((await Ad.countDocuments()) === 0 && customer) {
    const flatSubs = subIds;
    for (let index = 0; index < 40; index += 1) {
      const sub = flatSubs[index % flatSubs.length];
      const location = locationIds[index % locationIds.length];
      const adNumber = 10001 + index;
      const priceType = index % 11 === 0 ? "free" : index % 7 === 0 ? "contact" : index % 3 === 0 ? "negotiable" : "fixed";
      const attributes: Record<string, string | number> = {};
      if (sub.slug === "cars" || sub.slug === "trucks" || sub.slug === "motorcycles") {
        attributes.year = 2012 + (index % 12);
        attributes.make = makes[index % makes.length];
        attributes.model = ["Civic", "Camry", "F-150", "Model 3"][index % 4];
        attributes.mileage = 12000 + index * 1000;
      }
      if (["houses", "condos", "apartments", "commercial"].includes(sub.slug)) {
        attributes.beds = 1 + (index % 4);
        attributes.baths = 1 + (index % 3);
        attributes.sqft = 700 + index * 20;
      }
      await Ad.create({
        user: index % 5 === 0 ? admin!._id : customer._id,
        category: sub.category,
        subCategory: sub.id,
        location: location.id,
        title: titles[index],
        slug: `${slugify(titles[index])}-${adNumber}`,
        description: `${titles[index]} in ${location.city}. Serious local inquiries only. This sample listing is ready for search, filters, and moderation practice.`,
        price: priceType === "free" ? 0 : 25 + index * 37,
        priceType,
        attributes,
        images: sampleImages(sub.parent, index),
        contactName: index % 5 === 0 ? "Super Admin" : "Demo Customer",
        contactEmail: index % 5 === 0 ? email : demoEmail,
        contactPhone: "+15551230000",
        showPhone: index % 2 === 0,
        city: location.city,
        zip: location.zip,
        status: "live",
        expiresAt: new Date(Date.now() + 180 * 86400000),
        durationDays: 180,
        views: index * 3,
        isPrivateSeller: index % 4 !== 0,
        isFeatured: index % 10 === 0,
        adNumber,
      });
    }
    await Counter.findOneAndUpdate({ key: "ad" }, { key: "ad", seq: 10040 }, { upsert: true });
    console.log("Seeded 40 sample ads with remote image URLs");
  } else {
    const existing = await Ad.find({ adNumber: { $gte: 10001, $lte: 10040 } }).populate("category", "slug");
    for (const ad of existing) {
      const slug = (ad.category as { slug?: string } | null)?.slug || "community";
      ad.images = sampleImages(slug, Number(ad.adNumber) - 10001);
      await ad.save();
    }
    console.log(`Updated image URLs on ${existing.length} sample ads`);
  }

  console.log("Seed complete");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
