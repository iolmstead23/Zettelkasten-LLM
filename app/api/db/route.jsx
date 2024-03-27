import { NextResponse } from 'next/server'
import { MongoClient } from "mongodb"

export async function GET() {

    const client = new MongoClient(process.env.MONGODB_URI, {})

    try {
        await client.connect()
        const db = client.db("userdata")
        const posts = await db.collection('users').find({}).toArray()

        return NextResponse.json({"Success":posts})
    } catch (error) {
        return NextResponse.json({ error: 'Unable to connect to database' })
    } finally {
        await client.close()
    }
}

export async function POST(req) {
    
    const client = new MongoClient(process.env.MONGODB_URI, {})
    const data = await req.json()

    console.log(JSON.stringify(data))

    try {
        await client.connect()
        const db = client.db('userdata')
        const coll = db.collection('users')
        await coll.insertOne({data})

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Unable to connect to database' })
    } finally {
        await client.close()
    }
}