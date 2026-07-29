import path from 'path';
import dotenv from 'dotenv';
import connectDB from '../src/lib/mongodb';
import { Subject } from '../src/lib/models/Subject';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function parseAndCalculateDates(rawDate: string, decisionStr: string, rawDuration: string, notesStr: string = '') {
  let date = (rawDate || '').trim();
  const decision = (decisionStr || '').trim();
  let duration = (rawDuration || '').trim();
  const notes = (notesStr || '').trim();

  // Extract date from decision text or notes if date is empty
  if (!date && (decision || notes)) {
    const textToSearch = `${decision} ${notes}`;
    const dateMatch = textToSearch.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})\b/);
    if (dateMatch) {
      const d = dateMatch[1].padStart(2, '0');
      const m = dateMatch[2].padStart(2, '0');
      const y = dateMatch[3];
      date = `${d}/${m}/${y}`;
    }
  }

  // Calculate 2-year duration if duration is empty or missing end date
  if (!duration && date) {
    const parts = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (parts) {
      const d = parts[1].padStart(2, '0');
      const m = parts[2].padStart(2, '0');
      const startYear = parseInt(parts[3], 10);
      const endYear = startYear + 2;
      duration = `${d}/${m}/${startYear} - ${d}/${m}/${endYear} (02 năm)`;
    }
  } else if (duration && !duration.includes('02 năm') && duration.includes(' - ')) {
    duration = `${duration} (02 năm)`;
  }

  return { date, decision, duration };
}

async function main() {
  await connectDB();
  console.log('🔄 Đang cập nhật MongoDB với bộ bóc tách ngày thông minh nâng cao...');

  const subjects = await Subject.find({});
  let updatedCount = 0;

  for (const s of subjects) {
    const topParsed = parseAndCalculateDates(s.date || '', s.decision_num_date || '', s.duration || '', s.notes || '');

    let histories: any[] = Array.isArray(s.violation_histories) ? [...s.violation_histories] : [];
    
    if (histories.length === 0) {
      if (topParsed.date || topParsed.decision || topParsed.duration) {
        histories = [{
          action: s.status || 'Quản lý / Xử lý',
          date: topParsed.date,
          decision_num_date: topParsed.decision,
          duration: topParsed.duration,
        }];
      }
    } else {
      histories = histories.map(h => {
        const parsed = parseAndCalculateDates(
          h.date || topParsed.date || '',
          h.decision_num_date || topParsed.decision || '',
          h.duration || topParsed.duration || '',
          s.notes || ''
        );
        return {
          action: h.action || s.status || 'Quản lý / Xử lý',
          date: parsed.date,
          decision_num_date: parsed.decision,
          duration: parsed.duration,
        };
      });
    }

    s.date = topParsed.date || s.date;
    s.decision_num_date = topParsed.decision || s.decision_num_date;
    s.duration = topParsed.duration || s.duration;
    s.violation_histories = histories;

    await s.save();
    updatedCount++;
  }

  console.log(`✅ Đã ghi trực tiếp dữ liệu bóc tách ngày vào MongoDB cho ${updatedCount}/${subjects.length} đối tượng!`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
