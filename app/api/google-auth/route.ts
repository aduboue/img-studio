import { NextRequest, NextResponse } from 'next/server';
const { GoogleAuth } = require('google-auth-library');

export async function GET(req: NextRequest) {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();

    let email
    if (client !== undefined) { email = client.targetPrincipal }
    else { email = req.headers.get('X-Goog-Authenticated-User-Email') }

    console.log("XXXXXXXXXXXX EMAIL " + email) //#TODO temp log
    console.log("XXXXXXXXXXXX HEADERS " + JSON.stringify(req.headers, undefined, 4)) //#TODO temp log

    return NextResponse.json({
      targetPrincipal: email,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Authentication error', status: 500 });
  }
}
