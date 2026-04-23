"use client";
import { useState } from 'react';

export default function MigratePage() {
          const [status, setStatus] = useState('Idle');

  const runMigration = async () => {
              setStatus('Running...');
              try {
                            const importData = async (collection: string, url: string) => {
                                            const response = await fetch(url);
                                            const data = await response.json();
                                            const res = await fetch('/api/import-data', {
                                                              method: 'POST',
                                                              headers: { 'Content-Type': 'application/json' },
                                                              body: JSON.stringify({ collection, data, secret: 'import-qlmt-2024' })
                                            });
                                            return res.json();
                            };

                const res1 = await importData('subjects', 'https://raw.githubusercontent.com/nguyenphidam2-wq/qlmtlienchieu/main/scripts/export/subjects.json');
                            const res2 = await importData('customzones', 'https://raw.githubusercontent.com/nguyenphidam2-wq/qlmtlienchieu/main/scripts/export/customzones.json');
                            const res3 = await importData('businesses', 'https://raw.githubusercontent.com/nguyenphidam2-wq/qlmtlienchieu/main/scripts/export/businesses.json');

                setStatus(`Finished: ${JSON.stringify({subjects: res1.message, customzones: res2.message, businesses: res3.message})}`);
              } catch (e: any) {
                            setStatus(`Failed: ${e.message}`);
              }
  };

  return (
              <div className="p-10">
                    <h1 className="text-2xl font-bold mb-4">Data Migration</h1>
                    <button 
                                    onClick={runMigration}
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                  >
                            Run Migration
                    </button>b         <div className="mt-4 p-4 border rounded bg-gray-100 whitespace-pre-wrap">                     Status: {status}
                    </div>div>           </div>di           );
}</div>
