import PrintCenter from '../components/print/PrintCenter';

export default function PrintExport() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Print & Export</h1>
        <p className="text-sm text-gray-500 mt-1">Generate place cards, table assignments, and guest lists as PDFs</p>
      </div>
      <PrintCenter />
    </div>
  );
}
