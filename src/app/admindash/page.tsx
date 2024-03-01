import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import { getAllUsersAction } from "../actions/getAllusers"
import UsersTableComponent from "@/components/UsersTableComponent"

export default async function AdminDash() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["allUsers"],
    queryFn: () => getAllUsersAction(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTableComponent />
    </HydrationBoundary>
  )
}
