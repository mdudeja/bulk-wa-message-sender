import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { usePathname } from "next/navigation"

export default function TablePaginationComponent({
  currentPage,
  totalRows,
  rowsPerPage,
  islastPage,
}: {
  currentPage: number
  totalRows: number
  rowsPerPage: number
  islastPage: boolean
}) {
  const pathname = usePathname()

  const getPaginationLinks = () => {
    const links = []
    const start = Math.max(2, currentPage - 2)
    const end = Math.min(start + 1, Math.ceil(totalRows / rowsPerPage) - 1)
    for (let i = start; i <= end; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink href={`${pathname}?page=${i}`}>{i}</PaginationLink>
        </PaginationItem>
      )
    }
    return links
  }

  return (
    <Pagination className="justify-end mt-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={
              currentPage === 1
                ? "cursor-not-allowed text-muted hover:text-muted"
                : ""
            }
            href={
              currentPage === 1 ? "#" : `volunteers?page=${currentPage - 1}`
            }
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href={`/volunteers?page=1`}>1</PaginationLink>
        </PaginationItem>
        {...getPaginationLinks()}
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            href={`/volunteers?page=${Math.ceil(totalRows / rowsPerPage)}`}
          >
            {Math.ceil(totalRows / rowsPerPage)}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            className={
              islastPage ? "cursor-not-allowed text-muted hover:text-muted" : ""
            }
            href={islastPage ? "#" : `/volunteers?page=${currentPage + 1}`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
