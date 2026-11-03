import Card from '../ui/Card'

export default function ApiDocsTab() {
  return (
    <Card title="API Docs">
      <p className="text-sm text-slate-600 mb-4">
        Swagger UI бека: <code className="bg-slate-100 px-1 rounded">/docs</code>
      </p>
      <iframe
        src="/docs"
        title="Swagger UI"
        className="w-full h-[70vh] rounded-lg border border-slate-200 bg-white"
      />
    </Card>
  )
}
