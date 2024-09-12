import { NextRequest, NextResponse } from 'next/server';
const { GoogleAuth } = require('google-auth-library');

export async function GET(req: NextRequest) {
  let response = {}

  try {
    // For local development
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    if (client !== undefined && client['targetPrincipal']) {
      response = {
        targetPrincipal: client.targetPrincipal,
      }
    }
    // For prod version on Cloud Run x IAP
    else {
      response = {
        targetPrincipal: req.headers.get('X-Goog-Authenticated-User-Email'),
      }
    }

  } catch (error) {
    // For prod version on Cloud Run x IAP
    if (req.headers && req.headers.get('X-Goog-Authenticated-User-Email')) {
      response = {
        targetPrincipal: req.headers.get('X-Goog-Authenticated-User-Email'),
      }
    } else {
      console.error(error);
      response = { error: 'Authentication error', status: 500 }
    }
  }
  return NextResponse.json(response);
}
