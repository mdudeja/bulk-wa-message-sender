import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { SessionData } from "@/lib/interfaces/SessionData"
import { defaultSession } from "@/lib/AppSessionOptions"

async function fetchJson<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    ...init,
  })
  const json = await res.json()
  return json
}

const sessionApiUrl = "/api/session"

function doLogin(
  url: string,
  { arg }: { arg: { username?: string; password?: string; token?: string } }
) {
  return fetchJson<SessionData>(sessionApiUrl, {
    method: "POST",
    body: JSON.stringify({
      username: arg.username,
      password: arg.password,
      token: arg.token,
    }),
  })
}

function doLogout(url: string) {
  return fetchJson<SessionData>(sessionApiUrl, {
    method: "DELETE",
  })
}

export default function useSession() {
  const {
    data: session,
    isLoading,
    error,
  } = useSWR<SessionData>(
    sessionApiUrl,
    async () => await fetchJson<SessionData>(sessionApiUrl),
    {
      fallbackData: defaultSession,
      revalidateOnMount: true,
      compare: (a, b) => a?.user?.username === b?.user?.username,
    }
  )

  const { trigger: login } = useSWRMutation(sessionApiUrl, doLogin, {
    revalidate: true,
  })

  const { trigger: logout } = useSWRMutation(sessionApiUrl, doLogout)

  return { session, login, logout, isLoading }
}
