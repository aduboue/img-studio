import { NextRequest, NextResponse } from 'next/server';
const { GoogleAuth } = require('google-auth-library');

export async function GET(req: NextRequest) {
  let response = {}

  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();

    let email
    if (client !== undefined) {
      response = {
        targetPrincipal: client.targetPrincipal,
      }
    }
    else { throw Error('No ADC possible') }

    console.log("XXXXXXXXXXXX EMAIL " + email) //#TODO temp log
  } catch (error) {
    console.log("XXXXXXXXXXXX HEADERS " + JSON.stringify(req.headers, undefined, 4)) //#TODO temp log

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
