import { NextRequest, NextResponse } from "next/server"
import {
  createUser,
  fetchUserByUsername,
} from "@/lib/controllers/UserController"
import { TUser } from "@/lib/interfaces/User"
import { getIsUserAdmin, getIsUserLoggedIn } from "@/lib/getSession"

export async function POST(request: NextRequest) {
  const userLoggedIn = await getIsUserLoggedIn()
  const isAdmin = await getIsUserAdmin()
  const user: TUser = await request.json()

  if (!userLoggedIn || !isAdmin) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }

  const exists = await fetchUserByUsername(user.username)

  if (exists) {
    return NextResponse.json(
      {
        error: "User already exists",
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }

  const newUser = await createUser(user)

  if (!newUser) {
    return NextResponse.json(
      {
        error: "Failed to create user",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }

  return NextResponse.json(
    {
      id: newUser._id,
      username: newUser.username,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}
