import { NextRequest, NextResponse } from 'next/server';
const { GoogleAuth } = require('google-auth-library');

export async function GET(req: NextRequest) {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();  


    return NextResponse.json({
      projectId: projectId,
      client: client,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Authentication error', status: 500 });
  }
}
