const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/app/(dashboard)/b2b/page.tsx',
  'src/app/(dashboard)/customers/page.tsx',
  'src/app/(dashboard)/equipment/page.tsx',
  'src/app/(dashboard)/inventory/page.tsx',
  'src/app/(dashboard)/roasts/page.tsx',
  'src/app/(partner)/dashboard/page.tsx',
  'src/app/(partner)/orders/page.tsx',
  'src/app/(partner)/recurring/page.tsx',
  'src/components/PartnerManagementModal.tsx',
  'src/components/PartnersList.tsx',
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/<table className="w-full text-sm text-left">/g, '<table className="w-full text-sm text-left min-w-[800px]">');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
