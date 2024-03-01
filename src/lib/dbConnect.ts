import mongoose, { Mongoose } from "mongoose"

declare global {
  var mongoose: { conn: Mongoose | null; promise: Promise<Mongoose> | null }
}

const { MONGO_URI, MONGO_DB, MONGO_UNAME, MONGO_PWD } = process.env

if (!MONGO_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  )
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const username = encodeURIComponent(MONGO_UNAME ?? "")
    const password = encodeURIComponent(MONGO_PWD ?? "")
    const cluster_url = MONGO_URI
    const authMechanism = "DEFAULT"

    let url = `mongodb://${cluster_url}`
    if (username.length) {
      url = `mongodb+srv://${username}:${password}@${cluster_url}?authMechanism=${authMechanism}&retryWrites=true&w=majority`
    }

    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(url, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default dbConnect
