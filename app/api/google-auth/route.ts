import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  let response = {}

  try {
    if (req.headers.get('X-Goog-Authenticated-User-Email')) {
      response = {
        targetPrincipal: req.headers.get('X-Goog-Authenticated-User-Email'),
      }
    } else {
      throw Error('ID header not found')
    }
  } catch (error) {
    console.error(error)
    response = { error: 'Authentication error', status: 500 }
  }

  return NextResponse.json(response)
}
