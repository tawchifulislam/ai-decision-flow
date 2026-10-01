import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import { createRun } from '@/lib/run-store';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || !Array.isArray(body.nodes) || body.nodes.length === 0) {
    return NextResponse.json({ error: 'The graph is empty' }, { status: 400 });
  }

  const runId = crypto.randomUUID();
  createRun(runId);

  await inngest.send({
    name: 'workflow/run',
    data: {
      runId,
      input: String(body.input ?? ''),
      nodes: body.nodes,
      edges: Array.isArray(body.edges) ? body.edges : [],
    },
  });

  return NextResponse.json({ runId });
}
