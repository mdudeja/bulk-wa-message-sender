import dbConnect from "@/lib/dbConnect"
import UserModel from "@/lib/models/User.model"
import { TUser, TUserDTO } from "../interfaces/User"
import { createHmac, randomBytes } from "crypto"

const _init = async (): Promise<boolean> => {
  try {
    const connection = await dbConnect()
    return connection !== null
  } catch (e) {
    console.error(e)
    return false
  }
}

const _generate_hash = (password: string): string => {
  const salt = randomBytes(128).toString("hex")
  const hmac = createHmac("sha256", salt)
  const hash = hmac.update(password).digest("hex")

  return `${salt}:${hash}`
}

export const matchPassword = (hash: string, password: string): boolean => {
  const [salt, val] = hash.split(":")
  const hmac = createHmac("sha256", salt)
  const new_hash = hmac.update(password).digest("hex")

  return new_hash == val
}

export const getAllUsers = async (): Promise<TUserDTO[] | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const users = await UserModel.find(
    {},
    {
      password: 0,
      _id: 0,
      createdAt: 0,
      updatedAt: 0,
    }
  ).exec()

  return users.map((user) => user.toJSON())
}

export const fetchUserByUsername = async (
  username: string
): Promise<TUser | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const user = await UserModel.findOne(
    { username },
    {
      password: 0,
      _id: 0,
    }
  ).exec()

  return user?.toJSON()
}

export const createUser = async (user: TUser): Promise<TUser | undefined> => {
  const connection = await _init()

  if (!connection) {
    return
  }

  const pwdhash = _generate_hash(user.password)

  try {
    const newUser = new UserModel({
      ...user,
      password: pwdhash,
      isActive: true,
    })
    await newUser.save()
    return newUser.toJSON()
  } catch (e) {
    console.error(e)
    return
  }
}

export const updateUser = async (user: Partial<TUser>): Promise<boolean> => {
  const connection = await _init()

  if (!connection || !user.username) {
    return false
  }

  const exists = await fetchUserByUsername(user.username)

  if (!exists) {
    return false
  }

  try {
    await UserModel.updateOne(
      { username: user.username },
      {
        ...user,
      }
    ).exec()
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export const loginUser = async (
  username: string,
  password: string
): Promise<TUser | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const user = await await UserModel.findOne({ username }).exec()

  if (!user) {
    return null
  }

  const { password: pwdhash } = user

  if (!matchPassword(pwdhash, password)) {
    return null
  }

  return {
    ...user.toJSON(),
    password: undefined,
    _id: undefined,
  }
}
