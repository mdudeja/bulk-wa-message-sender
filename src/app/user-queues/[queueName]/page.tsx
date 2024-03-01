import { getRecipientDetails } from "@/app/actions/getRecipientDetails"
import QueueDetailsComponent from "@/components/QueueDetailsComponent"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

export default function UserQueueByNamePage({
  params,
}: {
  params: { queueName: string }
}) {
  const queryClient = new QueryClient()

  queryClient.prefetchQuery({
    queryKey: ["queue", params.queueName],
    queryFn: async () => {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/api/userQueues?queueName=${decodeURIComponent(params.queueName)}`,
        {
          method: "GET",
          credentials: "include",
        }
      )
      return res.json()
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <QueueDetailsComponent queueName={decodeURIComponent(params.queueName)} />
    </HydrationBoundary>
  )
}
