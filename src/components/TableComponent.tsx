"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import TableFilterComponent from "./TableFilterComponent"
import { useEffect, useReducer, useState } from "react"
import TablePaginationComponent from "./TablePaginationComponent"
import { Button } from "./ui/button"
import { XCircle, Delete, Play, Download } from "lucide-react"
import { TUserDTO } from "@/lib/interfaces/User"
import { TUserQueue } from "@/lib/interfaces/UserQueues"

const numericHeaders: string[] = ["createdAt", "updatedAt"]
const numericOperands = ["<", ">", "<=", ">=", "="]
const actionHeaders = ["actions"]

type tableStateType = {
  filterCriteria: string
  filterValue: string
  filterOperand: string
  rows: { [key: string]: string }[]
}

const cellValueToString = (value: any, header: string): string => {
  if (value === undefined || value === null) {
    return ""
  }

  if (numericHeaders.includes(header)) {
    return new Date(value).toLocaleString()
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (value instanceof Array) {
    return value.join("\n")
  }

  return value.toString()
}

export default function TableComponent({
  tableHeaders,
  data,
  rowsPerPage = 0,
  currentPage = 1,
  onDelete,
  onViewDetails,
  onDownloadCSV,
  truncateLongStrings = false,
}: {
  tableHeaders: string[]
  data?: TUserDTO[] | TUserQueue[] | null
  rowsPerPage?: number
  currentPage?: number
  onDelete?: (index: number) => void
  onViewDetails?: (index: number) => void
  onDownloadCSV?: (index: number) => void
  truncateLongStrings?: boolean
}) {
  function tableReducer(
    tstate: tableStateType,
    action: {
      type: "criteria" | "value" | "operand" | "rows" | "effect"
      payload: any
    }
  ): tableStateType {
    switch (action.type) {
      case "rows":
        return {
          ...tstate,
          rows: action.payload as { [key: string]: string }[],
        }
      case "criteria":
        return { ...tstate, filterCriteria: action.payload as string }
      case "value":
        return { ...tstate, filterValue: action.payload as string }
      case "operand":
        return { ...tstate, filterOperand: action.payload as string }
      default:
        return tstate
    }
  }

  function createInitialState(): tableStateType {
    return {
      filterCriteria: "",
      filterValue: "",
      filterOperand: "",
      rows: [],
    }
  }

  const [tableState, dispatch] = useReducer(
    tableReducer,
    null,
    createInitialState
  )

  const paginatedRows = (rows?: { [key: string]: string }[]) => {
    if (!rows) {
      return []
    }

    if (rowsPerPage === 0) {
      return rows
    }

    if (tableState.filterCriteria.length && tableState.filterValue.length) {
      return rows
    }

    const start = (currentPage - 1) * rowsPerPage
    const end = start + rowsPerPage

    return rows.slice(start, end)
  }

  useEffect(() => {
    if (!data) {
      return
    }

    const convertedData =
      data?.map((v: { [key: string]: any }) => {
        const converted: { [key: string]: string } = {}
        for (const key in v) {
          converted[key] = cellValueToString(v[key], key)
        }
        return converted
      }) ?? []

    if (
      tableState.filterCriteria.length === 0 ||
      tableState.filterValue.length === 0
    ) {
      dispatch({
        type: "rows",
        payload: convertedData,
      })
      return
    }

    const filteredRows = convertedData?.filter((row) => {
      if (tableState.filterOperand.length > 0) {
        const dateValue = new Date((row as any)[tableState.filterCriteria])
        const filterDate = new Date(tableState.filterValue)
        switch (tableState.filterOperand) {
          case "<":
            return dateValue < filterDate
          case ">":
            return dateValue > filterDate
          case "<=":
            return dateValue <= filterDate
          case ">=":
            return dateValue >= filterDate
          case "=":
            return dateValue === filterDate
        }
      }

      const value = (row as any)[tableState.filterCriteria]
        ?.trim()
        .toLowerCase()
      const filter = tableState.filterValue.trim().toLowerCase()

      if (filter.length === 0) {
        return value === filter || value === undefined
      }

      if (filter === "*") {
        return value?.length > 0
      }

      return value?.includes(filter)
    })

    dispatch({ type: "rows", payload: filteredRows ?? [] })
  }, [
    data,
    tableState.filterCriteria,
    tableState.filterValue,
    tableState.filterOperand,
  ])

  return (
    <div className="px-2 flex flex-col max-h-full overflow-hidden">
      <div className="mb-4 md:me-4">
        <div className="flex flex-col items-start md:flex-row md:items-center md:justify-end">
          <div className="flex flex-row items-start justify-center space-x-2">
            <TableFilterComponent
              columnDetails={tableHeaders.map((h) => {
                return {
                  label: h,
                  type: numericHeaders.includes(h) ? "date" : "string",
                }
              })}
              filterCriteria={tableState.filterCriteria}
              onCriteriaChange={(value) =>
                dispatch({ type: "criteria", payload: value })
              }
              filterValue={tableState.filterValue}
              onValueChange={(value) =>
                dispatch({ type: "value", payload: value })
              }
              listOfOperands={numericOperands}
              showFilterOperands={numericHeaders.includes(
                tableState.filterCriteria
              )}
              filterOperand={tableState.filterOperand}
              onOperandChange={(value) =>
                dispatch({ type: "operand", payload: value })
              }
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                dispatch({ type: "criteria", payload: "" })
                dispatch({ type: "value", payload: "" })
                dispatch({ type: "operand", payload: "" })
              }}
            >
              <Delete />
            </Button>
          </div>
        </div>
      </div>
      {data && (
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders.map((header) => (
                <TableHead key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows(tableState.rows)?.map((row, index) => (
              <TableRow key={index}>
                {tableHeaders.map((header) => {
                  if (actionHeaders.includes(header)) {
                    return (
                      <TableCell key={header}>
                        <div className="flex flex-row">
                          <Button
                            variant="ghost"
                            size="smIcon"
                            onClick={() => onDelete?.(index)}
                            disabled={row.type === "admin"}
                          >
                            <XCircle className="text-red-500 text-xs" />
                          </Button>
                          {onViewDetails && (
                            <Button
                              variant="ghost"
                              size="smIcon"
                              onClick={() => onViewDetails?.(index)}
                              disabled={row.type === "admin"}
                            >
                              <Play className="text-blue-500 text-xs" />
                            </Button>
                          )}
                          {onDownloadCSV && (
                            <Button
                              variant="ghost"
                              size="smIcon"
                              onClick={() => onDownloadCSV?.(index)}
                              disabled={row.type === "admin"}
                            >
                              <Download className="text-black-500 text-xs" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )
                  }
                  return (
                    <TableCell key={header}>
                      {truncateLongStrings && row[header].length > 32
                        ? row[header].substring(0, 8)
                        : row[header]}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {data?.length &&
        rowsPerPage > 0 &&
        data?.length > rowsPerPage &&
        !tableState.filterCriteria.length &&
        !tableState.filterValue.length && (
          <TablePaginationComponent
            currentPage={currentPage}
            totalRows={tableState.rows.length}
            rowsPerPage={rowsPerPage}
            islastPage={tableState.rows.length < rowsPerPage * currentPage}
          />
        )}
    </div>
  )
}
