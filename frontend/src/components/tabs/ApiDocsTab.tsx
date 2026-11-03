import Card from '../ui/Card'

export default function ApiDocsTab() {
  return (
    <Card title="API Docs">
      <p className="text-sm text-muted mb-4">
        Swagger UI бека: <code className="bg-surface px-1 rounded">/docs</code>
      </p>
      <iframe
        src="/docs"
        title="Swagger UI"
        className="w-full h-[70vh] rounded-lg border border-border bg-surface"
      />
    </Card>
  )
}
