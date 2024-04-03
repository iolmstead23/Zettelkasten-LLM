import { getSession } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server'
import { jwtDecode } from "jwt-decode"

export default async function middleware(req) {
  const response = NextResponse.next()
  const session = await getSession(req, response)
  const userID = await session?.idToken ? jwtDecode(session?.idToken).sub : null
    
  response.headers.set("userID",userID)
  return response
}