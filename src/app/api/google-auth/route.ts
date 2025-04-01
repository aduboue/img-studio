// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
