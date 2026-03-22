export interface BaseEntity {
    id: number
    created_at: string
    updated_at: string
}

export interface Pagination {
    limit: number
    offset: number
    total: number
}