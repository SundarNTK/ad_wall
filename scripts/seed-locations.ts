// Safe, additive: upserts a list of Indian cities as active locations. Does not touch ads, users or other masters.
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const cities: [string, string, string, number, number][] = [
  ["Pondy", "Puducherry", "605001", 11.9416, 79.8083],
  ["Karaikal", "Puducherry", "609602", 10.9254, 79.838],
  ["Chennai", "Tamil Nadu", "600001", 13.0827, 80.2707],
  ["Coimbatore", "Tamil Nadu", "641001", 11.0168, 76.9558],
  ["Madurai", "Tamil Nadu", "625001", 9.9252, 78.1198],
  ["Tiruchirappalli", "Tamil Nadu", "620001", 10.7905, 78.7047],
  ["Salem", "Tamil Nadu", "636001", 11.6643, 78.146],
  ["Tirunelveli", "Tamil Nadu", "627001", 8.7139, 77.7567],
  ["Vellore", "Tamil Nadu", "632001", 12.9165, 79.1325],
  ["Erode", "Tamil Nadu", "638001", 11.341, 77.7172],
  ["Cuddalore", "Tamil Nadu", "607001", 11.748, 79.7714],
  ["Villupuram", "Tamil Nadu", "605602", 11.939, 79.4924],
  ["Kanchipuram", "Tamil Nadu", "631501", 12.8342, 79.7036],
  ["Thanjavur", "Tamil Nadu", "613001", 10.787, 79.1378],
  ["Bengaluru", "Karnataka", "560001", 12.9716, 77.5946],
  ["Mysuru", "Karnataka", "570001", 12.2958, 76.6394],
  ["Hyderabad", "Telangana", "500001", 17.385, 78.4867],
  ["Visakhapatnam", "Andhra Pradesh", "530001", 17.6868, 83.2185],
  ["Vijayawada", "Andhra Pradesh", "520001", 16.5062, 80.648],
  ["Kochi", "Kerala", "682001", 9.9312, 76.2673],
  ["Thiruvananthapuram", "Kerala", "695001", 8.5241, 76.9366],
  ["Mumbai", "Maharashtra", "400001", 19.076, 72.8777],
  ["Pune", "Maharashtra", "411001", 18.5204, 73.8567],
  ["Nagpur", "Maharashtra", "440001", 21.1458, 79.0882],
  ["Delhi", "Delhi", "110001", 28.6139, 77.209],
  ["Kolkata", "West Bengal", "700001", 22.5726, 88.3639],
  ["Ahmedabad", "Gujarat", "380001", 23.0225, 72.5714],
  ["Surat", "Gujarat", "395003", 21.1702, 72.8311],
  ["Jaipur", "Rajasthan", "302001", 26.9124, 75.7873],
  ["Lucknow", "Uttar Pradesh", "226001", 26.8467, 80.9462],
  ["Bhopal", "Madhya Pradesh", "462001", 23.2599, 77.4126],
  ["Indore", "Madhya Pradesh", "452001", 22.7196, 75.8577],
  ["Panaji", "Goa", "403001", 15.4909, 73.8278],
  ["Chandigarh", "Chandigarh", "160017", 30.7333, 76.7794],
];

const slugify = (input: string) => input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const { dbConnect } = await import("../src/lib/db");
  const { Location } = await import("../src/models/Catalog");
  await dbConnect();
  let added = 0;
  let reactivated = 0;
  for (const [city, state, zip, lat, lng] of cities) {
    const slug = slugify(city);
    const existing = await Location.findOne({ slug });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
        reactivated += 1;
      }
      continue;
    }
    await Location.create({ country: "India", state, city, zip, lat, lng, slug, isActive: true });
    added += 1;
  }
  console.log(`Locations added: ${added}, reactivated: ${reactivated}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
