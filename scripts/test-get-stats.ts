import { getStats } from './src/lib/actions/subjects';

async function testStats() {
  const stats = await getStats();
  console.log("=== GET STATS RESULT ===");
  console.log("Total subjects in stats:", stats.total_subjects);
  console.log("Status counts:", stats.status_counts);
  console.log("Total businesses:", stats.total_businesses);
  console.log("TDP stats count:", Object.keys(stats.tdp_stats).length);
}

testStats().catch(console.error);
