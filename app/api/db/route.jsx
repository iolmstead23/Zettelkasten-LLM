import { NextResponse } from 'next/server'
import { MongoClient } from "mongodb"
import { headers } from 'next/headers'

export async function GET() {

    const client = new MongoClient(process.env.MONGODB_URI, {})
    const headersList = headers()
    const userID = headersList.get('userid')
    
    try {
        await client.connect()
        const db = client.db("userdata")
        const notes = await db.collection('notes').find({userID:userID}).toArray()
        return NextResponse.json(notes[0].data, {status: 200})
    } catch (error) {
        return NextResponse.json(error, {status: 400})
    } finally {
        await client.close()
    }
}

export async function POST(req) {
    
    const client = new MongoClient(process.env.MONGODB_URI, {})
    const data = await req.json()

    try {
        await client.connect()
        const db = client.db('userdata')
        const coll = db.collection('users')
        await coll.insertMany(data)

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Unable to connect to database' })
    } finally {
        await client.close()
    }
}